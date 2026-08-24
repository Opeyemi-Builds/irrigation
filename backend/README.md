# AgroSense API

The FastAPI service behind AgroSense. It ingests telemetry from the ESP32 field unit, serves the dashboard's live and historical data, and exposes an AI agronomy advisor. Every setting is optional, so the service boots and serves live data with **no environment variables at all** — keys only switch on extra features.

## Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI + Uvicorn |
| Validation | Pydantic v2 / pydantic-settings |
| AI | Anthropic SDK — Claude Haiku (`claude-haiku-4-5`) |
| Persistence | Supabase (PostgREST over httpx), optional |
| Runtime | Python 3.12 |

## Architecture

```
main.py            FastAPI app, CORS, router mounting
app/
├── config.py      Settings — env-driven, every field has a default
├── store.py       In-memory latest reading + reservoir distance→% math
├── db.py          Supabase persistence; no-ops when unconfigured
├── models.py      Pydantic models for the AI endpoints
├── ai.py          Crop knowledge base, prompt builder, rule engine
└── routes/
    ├── sensors.py telemetry · live · history · status
    └── ai.py      chat · recommend-irrigation
```

Two design choices worth noting:

- **In-memory first.** The latest reading is held in `store.py` and returned to the dashboard with no database round-trip. Persistence is a background task, so a slow or missing database can never delay or fail the device's POST.
- **Degrade, don't fail.** Missing Anthropic key, missing Supabase config, and missing weather key each disable only their own feature. The core telemetry loop always works.

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate           # Windows: venv\Scripts\activate
pip install -r requirements.txt

uvicorn main:app --reload          # http://localhost:8000
```

Interactive docs (Swagger UI) at `http://localhost:8000/docs`.

To enable optional features, copy the example env file and fill in what you need:

```bash
cp .env.example .env
```

## Endpoints

Base path: `/api/v1`.

### Sensors

#### `POST /api/v1/sensors/telemetry`
Ingest one reading from the device (posted every ~5 s). Converts the ultrasonic distance to a reservoir percentage, stores the reading in memory, and queues a background write to Supabase.

```json
// request
{ "temperature": 28.5, "humidity": 65.0, "soil_moisture": 42.0,
  "water_level_cm": 12.0, "pump_status": true, "is_charging": false }

// response
{ "status": "ok", "reservoir_pct": 60.0, "pump_status": true, "stored": false }
```
`stored` is `true` only when Supabase is configured.

#### `GET /api/v1/sensors/live`
Latest reading plus connection status. Polled by the dashboard every ~3 s. `connected` is `true` only if a reading arrived in the last 15 seconds.

```json
{ "connected": true,
  "data": { "temperature": 28.5, "humidity": 65.0, "soil_moisture": 42.0,
            "water_level_cm": 12.0, "reservoir_pct": 60.0,
            "pump_status": true, "is_charging": false,
            "received_at": "2026-08-24T14:58:12" },
  "message": "ok" }
```

#### `GET /api/v1/sensors/history?hours=N`
Readings from the last `N` hours (1–168, default 24), oldest first, from Supabase. Returns an empty list with `"persisted": false` when Supabase is not configured.

#### `GET /api/v1/sensors/status`
Lightweight `{ connected, last_seen }` for the status indicator.

### AI

#### `POST /api/v1/ai/chat`
Grounded advisor chat. Send the farmer's message plus optional live context (sensors, farm profile, weather, irrigation) and receive a crop-specific reply. Requires `ANTHROPIC_API_KEY`; returns 401 if the key is missing or invalid.

```json
// request
{ "message": "Should I irrigate today?",
  "history": [],
  "sensor_data": { "temperature": 28.4, "humidity": 62, "soil_moisture": 38 },
  "farm_profile": { "farm_name": "Demo Farm", "crop": "maize",
                    "growth_stage": "vegetative", "soil_type": "loamy",
                    "area_hectares": 1.0 },
  "weather": { "condition": "Sunny", "temperature": 28, "humidity": 62,
               "rain_probability_3h": 20, "rain_probability_6h": 45 },
  "irrigation": { "is_active": false, "last_irrigated_minutes_ago": 120,
                  "reservoir_level_pct": 67 } }

// response
{ "reply": "…", "suggested_action": "hold" }
```

#### `POST /api/v1/ai/recommend-irrigation`
Deterministic, rule-based decision — **no API key required**. Returns `should_irrigate`, a plain-language `reason`, an optional `duration_minutes`, and an `urgency` of `now` | `soon` | `later` | `hold`.

## How the advisor works

The chat system prompt is rebuilt for every request from live context, so Claude answers with real numbers rather than generic tips. It combines:

- the crop, growth stage, and soil type from the farm profile;
- the crop's optimal moisture band and daily water need from the built-in knowledge base;
- current sensor readings tagged `GOOD` / `WARNING` / `CRITICAL` against that band;
- weather with rain-probability flags, and the current irrigation and reservoir state.

The **knowledge base** ([`app/ai.py`](app/ai.py)) covers 8 crops — maize, tomato, cassava, pepper, rice, yam, plantain, soybean — each across 4 growth stages (seedling, vegetative, flowering, maturity) with moisture bands and daily water needs, plus drainage characteristics for sandy / loamy / clay / silty soils.

The **rule engine** (`recommend-irrigation`) evaluates, in order: hold for likely rain (≥65% in 3 h) → hold on a critically low reservoir (<10%) → hold when soil is saturated (>band max + 5) → irrigate now when critically dry (<band min − 10) → irrigate now/soon when below the band → otherwise hold or schedule for later. Run-time is estimated from the crop's daily water need, field area, and a 50 L/min flow rate.

## Configuration

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Optional | Enables `/ai/chat`. Get one at console.anthropic.com |
| `OPENWEATHER_API_KEY` | Optional | Reserved for live weather |
| `FARM_LAT` / `FARM_LON` | Optional | Farm location (default: Ibadan, NG) |
| `FRONTEND_URL` | Optional | CORS origin hint (CORS is open by default) |
| `SUPABASE_URL` | Optional | Supabase project URL — enables history |
| `SUPABASE_SERVICE_KEY` | Optional | Supabase **service-role** key — secret, backend-only |

The service-role key bypasses row-level security and must never reach the browser or version control.

## Persistence (optional)

When Supabase is configured, each reading is written to a `sensor_readings` table via PostgREST. Create it in the Supabase SQL editor:

```sql
create table sensor_readings (
  id             bigint generated always as identity primary key,
  received_at    timestamptz not null,
  temperature    real,
  humidity       real,
  soil_moisture  real,
  water_level_cm real,
  reservoir_pct  real,
  pump_status    boolean,
  is_charging    boolean
);
create index on sensor_readings (received_at desc);
```

## Deployment

Deploys to Render from the `render.yaml` blueprint at the repository root; the build is pinned to Python 3.12.7 via `.python-version`. See [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md) for the full walkthrough.
