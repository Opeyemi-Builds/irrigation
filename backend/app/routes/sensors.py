from fastapi import APIRouter, BackgroundTasks, Query
from pydantic import BaseModel
from datetime import datetime
from app import store, db

router = APIRouter(prefix="/sensors", tags=["Sensors"])


class TelemetryPayload(BaseModel):
    temperature: float
    humidity: float
    soil_moisture: float
    water_level_cm: float
    pump_status: bool
    is_charging: bool


@router.post("/telemetry", status_code=200)
async def receive_telemetry(payload: TelemetryPayload, background_tasks: BackgroundTasks):
    """Ingest one reading from the ESP32 (posted every ~5s). Stores it in memory for
    instant /live reads and persists it to Supabase in the background."""
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

    background_tasks.add_task(db.insert_reading, reading.model_dump())

    return {
        "status": "ok",
        "reservoir_pct": reservoir_pct,
        "pump_status": payload.pump_status,
        "stored": db.is_configured(),
    }


@router.get("/live")
async def get_live_data():
    """Latest reading plus connection status. Polled by the dashboard every ~3s."""
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


@router.get("/history")
def get_history(hours: int = Query(24, ge=1, le=168)):
    """Historical readings from Supabase for the last `hours` (max 168), oldest first.
    Returns an empty list with persisted=false when Supabase isn't configured."""
    readings = db.fetch_history(hours=hours)
    return {
        "hours": hours,
        "count": len(readings),
        "persisted": db.is_configured(),
        "readings": readings,
    }


@router.get("/status")
async def device_status():
    """Lightweight connection check for the status indicator."""
    return {
        "connected": store.is_connected(),
        "last_seen": store.get_reading().received_at if store.get_reading() else None,
    }
