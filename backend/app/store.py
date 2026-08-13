"""
In-memory store for the latest sensor telemetry from the ESP32.
Single field, single device — one reading at a time.
In production this would be a database, but for the prototype
this is fast, simple, and works perfectly.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class LiveReading(BaseModel):
    temperature: float
    humidity: float
    soil_moisture: float
    water_level_cm: float
    reservoir_pct: float          # computed from water_level_cm
    pump_status: bool
    is_charging: bool
    received_at: str              # ISO timestamp


# ── Singleton store ───────────────────────────────────────────────────────────
_latest: Optional[LiveReading] = None
_tank_height_cm: float = 30.0    # Distance from sensor to tank floor when EMPTY
                                  # Edit this to match your physical tank


def set_reading(reading: LiveReading) -> None:
    global _latest
    _latest = reading


def get_reading() -> Optional[LiveReading]:
    return _latest


def is_connected() -> bool:
    """True if we got a reading in the last 15 seconds."""
    if _latest is None:
        return False
    last = datetime.fromisoformat(_latest.received_at)
    delta = (datetime.utcnow() - last).total_seconds()
    return delta < 15


def distance_to_pct(distance_cm: float, tank_height_cm: float = _tank_height_cm) -> float:
    """
    Convert ultrasonic distance reading to reservoir percentage.
    Sensor sits at the TOP of the tank pointing DOWN.
    Small distance = full tank. Large distance = empty tank.

    Clamp between 0–100.
    """
    if distance_cm <= 0:
        return 0.0
    pct = ((tank_height_cm - distance_cm) / tank_height_cm) * 100
    return max(0.0, min(100.0, round(pct, 1)))
