"""In-memory store for the most recent ESP32 reading. One device, one reading
at a time — read on every /live poll, replaced on every telemetry POST."""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class LiveReading(BaseModel):
    temperature: float
    humidity: float
    soil_moisture: float
    water_level_cm: float
    reservoir_pct: float
    pump_status: bool
    is_charging: bool
    received_at: str


_latest: Optional[LiveReading] = None
_tank_height_cm: float = 10.0    # sensor-to-floor distance of an empty tank; match your hardware


def set_reading(reading: LiveReading) -> None:
    global _latest
    _latest = reading


def get_reading() -> Optional[LiveReading]:
    return _latest


def is_connected() -> bool:
    """True if a reading arrived in the last 15 seconds."""
    if _latest is None:
        return False
    last = datetime.fromisoformat(_latest.received_at)
    return (datetime.utcnow() - last).total_seconds() < 15


def distance_to_pct(distance_cm: float, tank_height_cm: float = _tank_height_cm) -> float:
    """Convert an ultrasonic distance to a reservoir percentage. The sensor sits at
    the top facing down, so a small distance means a full tank. Clamped to 0–100."""
    if distance_cm <= 0:
        return 0.0
    pct = ((tank_height_cm - distance_cm) / tank_height_cm) * 100
    return max(0.0, min(100.0, round(pct, 1)))


# ── Pump control command ─────────────────────────────────────────────────────
# One device, one command. The dashboard sets it; the ESP32 reads it back on its
# next telemetry POST (within ~5s) and applies it:
#   "auto" — on-device soil-moisture hysteresis (the default behaviour)
#   "on"   — manual override, pump forced ON
#   "off"  — manual override, pump forced OFF
# Held in memory only. A backend restart resets to "auto", which is the safe
# default: the pump returns to automatic control rather than being left stuck
# forced on or off with no one watching.
VALID_PUMP_COMMANDS = ("auto", "on", "off")

_pump_command: str = "auto"
_pump_command_at: Optional[str] = None


def set_pump_command(mode: str, at: str) -> None:
    global _pump_command, _pump_command_at
    _pump_command = mode
    _pump_command_at = at


def get_pump_command() -> str:
    return _pump_command


def get_pump_command_at() -> Optional[str]:
    return _pump_command_at
