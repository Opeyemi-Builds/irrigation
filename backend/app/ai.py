import anthropic
from app.models import (
    ChatRequest, ChatResponse,
    IrrigationRecommendationRequest, IrrigationRecommendation,
    SensorReading, FarmProfile, WeatherData, IrrigationStatus,
)
from app.config import get_settings
import json

# Optimal soil-moisture ranges (%) and daily water need (mm) per crop and stage.
CROP_PROFILES = {
    "maize": {
        "seedling":    {"moisture_min": 50, "moisture_max": 70, "daily_water_mm": 3},
        "vegetative":  {"moisture_min": 45, "moisture_max": 65, "daily_water_mm": 6},
        "flowering":   {"moisture_min": 55, "moisture_max": 75, "daily_water_mm": 8},
        "maturity":    {"moisture_min": 35, "moisture_max": 55, "daily_water_mm": 4},
    },
    "tomato": {
        "seedling":    {"moisture_min": 55, "moisture_max": 75, "daily_water_mm": 4},
        "vegetative":  {"moisture_min": 50, "moisture_max": 70, "daily_water_mm": 5},
        "flowering":   {"moisture_min": 60, "moisture_max": 80, "daily_water_mm": 7},
        "maturity":    {"moisture_min": 45, "moisture_max": 65, "daily_water_mm": 5},
    },
    "cassava": {
        "seedling":    {"moisture_min": 45, "moisture_max": 65, "daily_water_mm": 3},
        "vegetative":  {"moisture_min": 40, "moisture_max": 60, "daily_water_mm": 4},
        "flowering":   {"moisture_min": 45, "moisture_max": 65, "daily_water_mm": 5},
        "maturity":    {"moisture_min": 35, "moisture_max": 55, "daily_water_mm": 3},
    },
    "pepper": {
        "seedling":    {"moisture_min": 55, "moisture_max": 70, "daily_water_mm": 4},
        "vegetative":  {"moisture_min": 50, "moisture_max": 65, "daily_water_mm": 5},
        "flowering":   {"moisture_min": 55, "moisture_max": 70, "daily_water_mm": 6},
        "maturity":    {"moisture_min": 45, "moisture_max": 60, "daily_water_mm": 4},
    },
    "rice": {
        "seedling":    {"moisture_min": 70, "moisture_max": 90, "daily_water_mm": 8},
        "vegetative":  {"moisture_min": 75, "moisture_max": 95, "daily_water_mm": 10},
        "flowering":   {"moisture_min": 80, "moisture_max": 95, "daily_water_mm": 12},
        "maturity":    {"moisture_min": 60, "moisture_max": 80, "daily_water_mm": 6},
    },
    "yam": {
        "seedling":    {"moisture_min": 50, "moisture_max": 70, "daily_water_mm": 4},
        "vegetative":  {"moisture_min": 45, "moisture_max": 65, "daily_water_mm": 5},
        "flowering":   {"moisture_min": 50, "moisture_max": 70, "daily_water_mm": 6},
        "maturity":    {"moisture_min": 35, "moisture_max": 55, "daily_water_mm": 3},
    },
    "plantain": {
        "seedling":    {"moisture_min": 55, "moisture_max": 75, "daily_water_mm": 5},
        "vegetative":  {"moisture_min": 50, "moisture_max": 70, "daily_water_mm": 6},
        "flowering":   {"moisture_min": 55, "moisture_max": 75, "daily_water_mm": 7},
        "maturity":    {"moisture_min": 50, "moisture_max": 70, "daily_water_mm": 5},
    },
    "soybean": {
        "seedling":    {"moisture_min": 45, "moisture_max": 65, "daily_water_mm": 3},
        "vegetative":  {"moisture_min": 45, "moisture_max": 65, "daily_water_mm": 5},
        "flowering":   {"moisture_min": 55, "moisture_max": 75, "daily_water_mm": 7},
        "maturity":    {"moisture_min": 40, "moisture_max": 60, "daily_water_mm": 4},
    },
}

SOIL_DRAINAGE = {
    "sandy": "fast-draining — loses moisture quickly, needs more frequent irrigation",
    "loamy": "balanced drainage and retention — ideal for most crops",
    "clay":  "slow-draining — retains moisture long, risk of waterlogging",
    "silty": "moderate drainage — good retention, medium irrigation frequency",
}


def _get_crop_info(crop: str, stage: str) -> dict:
    crop_lower = crop.lower()
    stage_lower = stage.lower()
    profiles = CROP_PROFILES.get(crop_lower, CROP_PROFILES["maize"])
    return profiles.get(stage_lower, profiles["vegetative"])


def _build_system_prompt(
    farm: FarmProfile | None,
    sensors: SensorReading | None,
    weather: WeatherData | None,
    irrigation: IrrigationStatus | None,
) -> str:
    """Build a rich, context-loaded system prompt for the AI advisor."""

    crop_info = None
    if farm:
        crop_info = _get_crop_info(farm.crop, farm.growth_stage)

    context_blocks = []

    if farm:
        context_blocks.append(f"""FARM PROFILE:
- Farm name: {farm.farm_name}
- Crop: {farm.crop.capitalize()} ({farm.growth_stage} stage)
- Soil type: {farm.soil_type} ({SOIL_DRAINAGE.get(farm.soil_type, 'unknown')})
- Field area: {farm.area_hectares} hectares""")

    if crop_info and farm:
        context_blocks.append(f"""CROP REQUIREMENTS FOR {farm.crop.upper()} ({farm.growth_stage.upper()} STAGE):
- Optimal soil moisture: {crop_info['moisture_min']}–{crop_info['moisture_max']}%
- Daily water need: ~{crop_info['daily_water_mm']}mm/day (~{round(crop_info['daily_water_mm'] * (farm.area_hectares * 10000) / 1000)} litres/day for this field)""")

    if sensors:
        moisture_status = "CRITICAL - below minimum" if (crop_info and sensors.soil_moisture < crop_info['moisture_min']) \
            else "WARNING - slightly low" if (crop_info and sensors.soil_moisture < crop_info['moisture_min'] + 5) \
            else "GOOD" if (crop_info and sensors.soil_moisture <= crop_info['moisture_max']) \
            else "HIGH - above optimal"
        context_blocks.append(f"""LIVE SENSOR DATA (right now):
- Temperature: {sensors.temperature}°C
- Humidity: {sensors.humidity}%
- Soil moisture: {sensors.soil_moisture}% [{moisture_status}]""")

    if weather:
        rain_alert = ""
        if weather.rain_probability_3h >= 60:
            rain_alert = " — HIGH rain probability in 3h, recommend holding irrigation"
        elif weather.rain_probability_3h >= 40:
            rain_alert = " — moderate rain possible in 3h"
        context_blocks.append(f"""WEATHER FORECAST:
- Current condition: {weather.condition}, {weather.temperature}°C, humidity {weather.humidity}%
- Rain probability (next 3h): {weather.rain_probability_3h}%{rain_alert}
- Rain probability (next 6h): {weather.rain_probability_6h}%""")

    if irrigation:
        last = f"{irrigation.last_irrigated_minutes_ago} minutes ago" if irrigation.last_irrigated_minutes_ago else "unknown"
        context_blocks.append(f"""IRRIGATION STATUS:
- Currently irrigating: {'YES' if irrigation.is_active else 'NO'}
- Last irrigated: {last}
- Reservoir level: {irrigation.reservoir_level_pct}%""")

    context_section = "\n\n".join(context_blocks)

    return f"""You are AgroSense AI — an expert agricultural advisor embedded in a smart irrigation system. You give clear, specific, actionable advice to a farmer in Nigeria based on live sensor data and crop science.

{context_section}

PERSONALITY & RULES:
- Be concise but thorough. Farmers are busy — get to the point fast.
- Always ground your advice in the actual numbers above. Never give generic advice when you have real data.
- Use bold (**text**) for important values and action items.
- When soil moisture is outside the optimal range, always say what it is, what it should be, and what to do.
- If rain is forecast above 60% in 3h, always recommend holding or reducing irrigation.
- If the reservoir is below 20%, flag it.
- Keep responses under 200 words unless a detailed explanation is genuinely needed.
- Never hallucinate sensor values — only use the numbers provided above.
- Address the farmer as "you" — personal, not clinical.
"""


async def get_ai_response(req: ChatRequest) -> ChatResponse:
    settings = get_settings()

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    system = _build_system_prompt(
        farm=req.farm_profile,
        sensors=req.sensor_data,
        weather=req.weather,
        irrigation=req.irrigation,
    )

    # Keep the last 10 turns to bound token use.
    messages = [
        {"role": m.role, "content": m.content}
        for m in req.history[-10:]
    ]
    messages.append({"role": "user", "content": req.message})

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=600,
        system=system,
        messages=messages,
    )

    reply_text = response.content[0].text

    # Surface a suggested action the frontend can act on.
    lower = reply_text.lower()
    suggested_action = None
    if any(w in lower for w in ["irrigate now", "start irrigation", "run irrigation", "turn on"]):
        suggested_action = "irrigate"
    elif any(w in lower for w in ["hold", "pause", "stop irrigation", "don't irrigate", "rain"]):
        suggested_action = "hold"
    elif any(w in lower for w in ["reduce", "less water", "cut back"]):
        suggested_action = "reduce"

    return ChatResponse(reply=reply_text, suggested_action=suggested_action)


async def get_irrigation_recommendation(req: IrrigationRecommendationRequest) -> IrrigationRecommendation:
    """Decide whether to irrigate from crop targets, live moisture, weather and reservoir state."""
    sensors = req.sensor_data
    farm = req.farm_profile
    weather = req.weather
    irrigation = req.irrigation

    crop_info = _get_crop_info(farm.crop, farm.growth_stage)
    moisture_min = crop_info["moisture_min"]
    moisture_max = crop_info["moisture_max"]
    daily_water_mm = crop_info["daily_water_mm"]

    litres_per_mm = farm.area_hectares * 10000 / 1000
    litres_needed = daily_water_mm * litres_per_mm

    flow_rate_lpm = 50
    duration_minutes = round(litres_needed / flow_rate_lpm)

    # Rain coming — hold.
    if weather.rain_probability_3h >= 65:
        return IrrigationRecommendation(
            should_irrigate=False,
            reason=f"Rain is forecast with {weather.rain_probability_3h:.0f}% probability in the next 3 hours. Irrigation paused to conserve water.",
            urgency="hold",
        )

    # Reservoir critically low — hold.
    if irrigation.reservoir_level_pct < 10:
        return IrrigationRecommendation(
            should_irrigate=False,
            reason=f"Reservoir is critically low at {irrigation.reservoir_level_pct:.0f}%. Refill before irrigating.",
            urgency="hold",
        )

    # Soil already saturated — hold.
    if sensors.soil_moisture > moisture_max + 5:
        return IrrigationRecommendation(
            should_irrigate=False,
            reason=f"Soil moisture is at {sensors.soil_moisture:.0f}% — above the {moisture_max}% optimal maximum for {farm.crop} at {farm.growth_stage} stage. No irrigation needed.",
            urgency="hold",
        )

    # Critically dry — irrigate now.
    if sensors.soil_moisture < moisture_min - 10:
        return IrrigationRecommendation(
            should_irrigate=True,
            reason=f"Soil moisture is critically low at {sensors.soil_moisture:.0f}% (optimal minimum: {moisture_min}%). Immediate irrigation required to prevent crop stress.",
            duration_minutes=duration_minutes,
            urgency="now",
        )

    # Below optimal with no rain coming — irrigate soon.
    if sensors.soil_moisture < moisture_min:
        urgency = "now" if weather.rain_probability_6h < 40 else "soon"
        return IrrigationRecommendation(
            should_irrigate=True,
            reason=f"Soil moisture at {sensors.soil_moisture:.0f}% is below the {moisture_min}% minimum for {farm.crop}. Irrigate {'now' if urgency == 'now' else 'within 2 hours'}.",
            duration_minutes=duration_minutes,
            urgency=urgency,
        )

    # In range and recently irrigated — hold.
    if (irrigation.last_irrigated_minutes_ago is not None
            and irrigation.last_irrigated_minutes_ago < 120
            and sensors.soil_moisture >= moisture_min):
        return IrrigationRecommendation(
            should_irrigate=False,
            reason=f"Soil moisture is at {sensors.soil_moisture:.0f}% (optimal range: {moisture_min}–{moisture_max}%) and the field was irrigated {irrigation.last_irrigated_minutes_ago} minutes ago. No action needed.",
            urgency="later",
        )

    # In range — schedule for later.
    return IrrigationRecommendation(
        should_irrigate=False,
        reason=f"Soil moisture is healthy at {sensors.soil_moisture:.0f}% (optimal: {moisture_min}–{moisture_max}%). Next irrigation recommended in a few hours.",
        urgency="later",
    )
