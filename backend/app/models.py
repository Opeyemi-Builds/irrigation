from pydantic import BaseModel
from typing import Literal, Optional


class SensorReading(BaseModel):
    temperature: float      # °C
    humidity: float         # %
    soil_moisture: float    # %


class FarmProfile(BaseModel):
    farm_name: str
    crop: str               # e.g. "maize", "tomato"
    growth_stage: str       # "seedling" | "vegetative" | "flowering" | "maturity"
    soil_type: str          # "loamy" | "sandy" | "clay" | "silty"
    area_hectares: float = 1.0


class IrrigationStatus(BaseModel):
    is_active: bool
    last_irrigated_minutes_ago: Optional[int] = None
    reservoir_level_pct: float = 67.0


class WeatherData(BaseModel):
    condition: str
    temperature: float
    humidity: float
    rain_probability_3h: float   # 0–100
    rain_probability_6h: float


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []
    sensor_data: Optional[SensorReading] = None
    farm_profile: Optional[FarmProfile] = None
    weather: Optional[WeatherData] = None
    irrigation: Optional[IrrigationStatus] = None


class ChatResponse(BaseModel):
    reply: str
    suggested_action: Optional[str] = None   # "irrigate" | "hold" | "reduce" | None


class IrrigationRecommendationRequest(BaseModel):
    sensor_data: SensorReading
    farm_profile: FarmProfile
    weather: WeatherData
    irrigation: IrrigationStatus


class IrrigationRecommendation(BaseModel):
    should_irrigate: bool
    reason: str
    duration_minutes: Optional[int] = None
    urgency: Literal["now", "soon", "later", "hold"]
