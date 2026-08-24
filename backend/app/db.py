"""Supabase persistence over the PostgREST REST API (via httpx).

When SUPABASE_URL / SUPABASE_SERVICE_KEY are unset, every call here is a no-op:
inserts are skipped and history returns []. The app then runs on in-memory data
alone, so local dev never depends on the database being present.
"""
from datetime import datetime, timedelta
from typing import Optional
import httpx

from app.config import get_settings

TABLE = "sensor_readings"
_TIMEOUT = 8.0


def _rest_url() -> Optional[str]:
    s = get_settings()
    if not s.supabase_url or not s.supabase_service_key:
        return None
    return f"{s.supabase_url.rstrip('/')}/rest/v1/{TABLE}"


def _headers() -> dict:
    key = get_settings().supabase_service_key
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }


def is_configured() -> bool:
    return _rest_url() is not None


def insert_reading(row: dict) -> None:
    """Insert one telemetry row. Runs in a background task and never raises,
    so a slow or unreachable database can't block or fail the ESP32's POST."""
    url = _rest_url()
    if url is None:
        return
    try:
        resp = httpx.post(
            url,
            headers={**_headers(), "Prefer": "return=minimal"},
            json=row,
            timeout=_TIMEOUT,
        )
        if resp.status_code >= 300:
            print(f"[supabase] insert failed {resp.status_code}: {resp.text[:300]}")
    except Exception as e:
        print(f"[supabase] insert error: {e}")


def fetch_history(hours: int = 24, limit: int = 2000) -> list[dict]:
    """Readings from the last `hours`, oldest first. [] if unconfigured or on error."""
    url = _rest_url()
    if url is None:
        return []
    since = (datetime.utcnow() - timedelta(hours=hours)).isoformat()
    params = {
        "select": "received_at,temperature,humidity,soil_moisture,"
                  "water_level_cm,reservoir_pct,pump_status,is_charging",
        "received_at": f"gte.{since}",
        "order": "received_at.asc",
        "limit": str(limit),
    }
    try:
        resp = httpx.get(url, headers=_headers(), params=params, timeout=_TIMEOUT)
        if resp.status_code >= 300:
            print(f"[supabase] history failed {resp.status_code}: {resp.text[:300]}")
            return []
        return resp.json()
    except Exception as e:
        print(f"[supabase] history error: {e}")
        return []
