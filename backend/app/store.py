"""In-memory store for the most recent ESP32 reading. One device, one reading
at a time — read on every /live poll, replaced on every telemetry POST."""
import os
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
# Reservoir calibration — the ultrasonic sensor sits at the top of the tank facing
# down, so it measures the distance to the water surface. A near-full tank reads a
# small distance; an empty tank reads a larger one. Match these to your hardware.
_water_empty_cm: float = 10.0   # distance the sensor reads when the tank is empty (0%)
_water_full_cm: float = 8.0     # distance the sensor reads when the tank is full  (100%)


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


def distance_to_pct(distance_cm: float,
                    empty_cm: float = _water_empty_cm,
                    full_cm: float = _water_full_cm) -> float:
    """Convert an ultrasonic distance (cm to the water surface) to a reservoir
    percentage. The sensor faces down from the top, so a small distance means a
    full tank: `full_cm` maps to 100% and `empty_cm` to 0%. Clamped to 0–100.
    A non-positive distance is treated as a bad reading and reported as empty."""
    if distance_cm <= 0:
        return 0.0
    span = empty_cm - full_cm
    if span <= 0:
        return 0.0
    pct = ((empty_cm - distance_cm) / span) * 100
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


# ── Device-linked Product IDs ─────────────────────────────────────────────────
# A farm is identified by its Product ID (0001–0050), but there is one physical
# ESP32. These are the IDs "attached" to that real hardware: a farm logged in
# under one of them sees the device's live readings and can control its pump.
# Every other ID is still a valid farm (its own name + crops) but has no device,
# so it shows "waiting for a device" instead of another farm's data.
#   - 0001 is the main product (the built-in demo account).
#   - 0002 is attached to the same device too, so a second account can demo it.
# Override as you add real hardware with the DEVICE_PRODUCT_IDS env var
# (comma-separated), e.g. DEVICE_PRODUCT_IDS="0001,0002,0009".
def _parse_device_ids(raw: str) -> frozenset:
    return frozenset(p.strip().zfill(4) for p in raw.split(",") if p.strip())


DEVICE_PRODUCT_IDS = _parse_device_ids(os.getenv("DEVICE_PRODUCT_IDS", "0001,0002"))


def is_device_linked(product_id: Optional[str]) -> bool:
    """True if this Product ID is attached to the physical device. A missing ID
    is treated as linked, so a direct call or older client that doesn't send one
    keeps working."""
    if not product_id:
        return True
    return product_id.strip().zfill(4) in DEVICE_PRODUCT_IDS
