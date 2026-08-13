# AgroSense Backend

FastAPI backend powering the AgroSense smart irrigation AI advisor.

## Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI |
| AI Model | Claude Haiku (via Anthropic SDK) |
| Language | Python 3.11+ |
| Server | Uvicorn |

## Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create your .env file
cp .env.example .env
# Then open .env and add your ANTHROPIC_API_KEY
```

## Running

```bash
uvicorn main:app --reload
```

Server starts at `http://localhost:8000`

Interactive API docs at `http://localhost:8000/docs`

## Endpoints

### `POST /api/v1/ai/chat`
Main AI advisor chat. Send the farmer's message + live sensor/weather context.
Returns a grounded, crop-specific reply from Claude.

**Request body:**
```json
{
  "message": "Should I irrigate today?",
  "history": [],
  "sensor_data": { "temperature": 28.4, "humidity": 62, "soil_moisture": 38 },
  "farm_profile": { "farm_name": "Demo Farm", "crop": "maize", "growth_stage": "vegetative", "soil_type": "loamy", "area_hectares": 1.0 },
  "weather": { "condition": "Sunny", "temperature": 28, "humidity": 62, "rain_probability_3h": 20, "rain_probability_6h": 45 },
  "irrigation": { "is_active": false, "last_irrigated_minutes_ago": 120, "reservoir_level_pct": 67 }
}
```

### `POST /api/v1/ai/recommend-irrigation`
Rule-based + AI hybrid irrigation decision engine.
Returns `should_irrigate`, `reason`, `duration_minutes`, `urgency`.

Urgency levels: `now` | `soon` | `later` | `hold`

## How the AI works

The system prompt is dynamically built for every request with:
- The farmer's crop, growth stage, and soil type
- Crop-specific optimal moisture ranges (from the built-in knowledge base)
- Exact current sensor readings labeled with status (GOOD / WARNING / CRITICAL)
- Weather forecast with rain probability flags
- Current irrigation and reservoir state

This means Claude always responds with specific numbers and crop-relevant advice, not generic tips.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | Get from console.anthropic.com |
| `OPENWEATHER_API_KEY` | ❌ | Optional, for real weather data later |
| `FARM_LAT` / `FARM_LON` | ❌ | Farm location for weather API |
| `FRONTEND_URL` | ❌ | CORS origin (default: localhost:5173) |
