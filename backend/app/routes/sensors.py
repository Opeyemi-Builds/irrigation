from fastapi import APIRouter, BackgroundTasks, Query
from pydantic import BaseModel
from datetime import datetime
from app import store, db

router = APIRouter(prefix="/sensors", tags=["Sensors"])


# ── Inbound model (matches ESP32 JSON payload exactly) ────────────────────────
class TelemetryPayload(BaseModel):
    temperature: float
    humidity: float
    soil_moisture: float
    water_level_cm: float
    pump_status: bool
    is_charging: bool


# ── POST /api/v1/sensors/telemetry ───────────────────────────────────────────
@router.post("/telemetry", status_code=200)
async def receive_telemetry(payload: TelemetryPayload, background_tasks: BackgroundTasks):
    """
    Called by the ESP32 every 5 seconds.
    Stores the latest reading in memory (for instant /live reads) AND persists
    it to Supabase in the background, then returns acknowledgement.
    """
    reservoir_pct = store.distance_to_pct(payload.water_level_cm)

    reading = store.LiveReading(
        temperature=round(payload.temperature, 1),
        humidity=round(payload.humidity, 1),
        soil_moisture=round(payload.soil_moisture, 1),
        water_level_cm=round(payload.water_level_cm, 1),
        reservoir_pct=reservoir_pct,
        pump_status=payload.pump_status,
        is_charging=payload.is_charging,
        received_at=datetime.utcnow().isoformat(),
    )
    store.set_reading(reading)

    # Persist after responding, so a slow/absent DB never delays the ESP32.
    background_tasks.add_task(db.insert_reading, reading.model_dump())

    return {
        "status": "ok",
        "reservoir_pct": reservoir_pct,
        "pump_status": payload.pump_status,
        "stored": db.is_configured(),   # True once Supabase keys are set
    }


# ── GET /api/v1/sensors/live ─────────────────────────────────────────────────
@router.get("/live")
async def get_live_data():
    """
    Called by the frontend every 3 seconds to poll latest sensor data.
    Returns the most recent ESP32 reading plus connection status.
    """
    reading = store.get_reading()
    connected = store.is_connected()

    if reading is None:
        return {
            "connected": False,
            "data": None,
            "message": "No data received yet. Waiting for device...",
        }

    return {
        "connected": connected,
        "data": reading.model_dump(),
        "message": "ok" if connected else "Device offline — showing last known reading",
    }


# ── GET /api/v1/sensors/history ──────────────────────────────────────────────
@router.get("/history")
def get_history(hours: int = Query(24, ge=1, le=168)):
    """
    Historical readings from Supabase for the last `hours` (default 24, max 168),
    ordered oldest -> newest. Powers the dashboard trend charts.

    Returns an empty list (with persisted=false) if Supabase isn't configured yet,
    so the frontend can safely fall back to demo data.
    """
    readings = db.fetch_history(hours=hours)
    return {
        "hours": hours,
        "count": len(readings),
        "persisted": db.is_configured(),
        "readings": readings,
    }


# ── GET /api/v1/sensors/status ────────────────────────────────────────────────
@router.get("/status")
async def device_status():
    """Quick connection check — used by the frontend status indicator."""
    return {
        "connected": store.is_connected(),
        "last_seen": store.get_reading().received_at if store.get_reading() else None,
    }
