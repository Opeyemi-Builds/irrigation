from fastapi import APIRouter, BackgroundTasks, Query, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app import store, db

router = APIRouter(prefix="/sensors", tags=["Sensors"])


class TelemetryPayload(BaseModel):
    temperature: float
    humidity: float
    soil_moisture: float
    water_level_cm: float
    water_level_percent: Optional[float] = None  # the % the device shows on its TFT
    pump_status: bool
    is_charging: bool


class PumpCommand(BaseModel):
    mode: str  # "auto" | "on" | "off"
    product_id: Optional[str] = None  # which farm is sending the command


@router.post("/telemetry", status_code=200)
async def receive_telemetry(payload: TelemetryPayload, background_tasks: BackgroundTasks):
    """Ingest one reading from the ESP32 (posted every ~5s). Stores it in memory for
    instant /live reads and persists it to Supabase in the background."""
    # Use the exact percentage the device computed and shows on its own TFT screen,
    # so the dashboard matches the hardware readout precisely. Fall back to deriving
    # it from the raw ultrasonic distance only for older firmware that doesn't send
    # a percent (or a direct test call).
    if payload.water_level_percent is not None:
        reservoir_pct = round(max(0.0, min(100.0, payload.water_level_percent)), 1)
    else:
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
        "pump_command": store.get_pump_command(),  # ESP32 applies this (auto/on/off)
        "stored": db.is_configured(),
    }


@router.get("/live")
async def get_live_data(product_id: Optional[str] = Query(None)):
    """Latest reading plus connection status. Polled by the dashboard every ~3s.

    `product_id` scopes the request to one farm: only IDs attached to the physical
    device (see store.DEVICE_PRODUCT_IDS — 0001 and 0002 by default) receive live
    data. Any other farm gets `linked: false` and no reading, so it shows a
    "waiting for a device" state rather than another farm's telemetry."""
    if not store.is_device_linked(product_id):
        return {
            "connected": False,
            "linked": False,
            "data": None,
            "pump_command": "auto",
            "message": "No device is linked to this farm yet.",
        }

    reading = store.get_reading()
    connected = store.is_connected()

    if reading is None:
        return {
            "connected": False,
            "linked": True,
            "data": None,
            "pump_command": store.get_pump_command(),
            "message": "No data received yet. Waiting for device...",
        }

    return {
        "connected": connected,
        "linked": True,
        "data": reading.model_dump(),
        "pump_command": store.get_pump_command(),
        "message": "ok" if connected else "Device offline — showing last known reading",
    }


@router.post("/command")
async def update_pump_command(cmd: PumpCommand):
    """Set the pump control mode from the dashboard. The ESP32 reads it back on its
    next telemetry POST (within ~5s) and applies it: 'auto' hands control to the
    on-device soil-moisture hysteresis, 'on'/'off' force the pump as a manual
    override. If the device is offline the command is held and applied on reconnect.

    Only a farm attached to the physical device (store.DEVICE_PRODUCT_IDS) may
    command the pump — other farms have no hardware to control."""
    mode = cmd.mode.strip().lower()
    if mode not in store.VALID_PUMP_COMMANDS:
        raise HTTPException(
            status_code=422,
            detail=f"mode must be one of {list(store.VALID_PUMP_COMMANDS)}",
        )
    if not store.is_device_linked(cmd.product_id):
        raise HTTPException(
            status_code=403,
            detail="This farm has no device linked, so its pump can't be controlled.",
        )
    store.set_pump_command(mode, datetime.utcnow().isoformat())
    return {"mode": mode, "updated_at": store.get_pump_command_at()}


@router.get("/command")
async def read_pump_command():
    """Current pump command. The ESP32 also receives this inline on every telemetry
    POST response, so a separate poll is optional."""
    return {"mode": store.get_pump_command(), "updated_at": store.get_pump_command_at()}


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
