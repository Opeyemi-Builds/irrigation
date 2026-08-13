from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from app import store

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
async def receive_telemetry(payload: TelemetryPayload):
    """
    Called by the ESP32 every 5 seconds.
    Stores the latest reading in memory and returns acknowledgement.
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

    return {
        "status": "ok",
        "reservoir_pct": reservoir_pct,
        "pump_status": payload.pump_status,
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


# ── GET /api/v1/sensors/status ────────────────────────────────────────────────
@router.get("/status")
async def device_status():
    """Quick connection check — used by the frontend status indicator."""
    return {
        "connected": store.is_connected(),
        "last_seen": store.get_reading().received_at if store.get_reading() else None,
    }
