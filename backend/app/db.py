"""
Supabase persistence via the PostgREST REST API, using httpx (already a
dependency — no extra packages, no version conflicts).

If SUPABASE_URL / SUPABASE_SERVICE_KEY are not set in .env, every function
here becomes a safe no-op: inserts are skipped and history returns []. That
means the app still runs perfectly on in-memory data alone — exactly like
before — so local dev and demos never break just because the DB is absent.
"""
from datetime import datetime, timedelta
from typing import Optional
import httpx

from app.config import get_settings

TABLE = "sensor_readings"
_TIMEOUT = 8.0


def _rest_url() -> Optional[str]:
    """Base REST endpoint for the table, or None if Supabase isn't configured."""
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
    """True when SUPABASE_URL and SUPABASE_SERVICE_KEY are both set."""
    return _rest_url() is not None


def insert_reading(row: dict) -> None:
    """
    Insert one telemetry row. Called from a FastAPI BackgroundTask (runs in a
    threadpool AFTER the response is sent), so a slow or unreachable database
    never blocks or fails the ESP32's POST. Errors are logged, never raised.
    """
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
    except Exception as e:  # noqa: BLE001 — never crash the caller over telemetry
        print(f"[supabase] insert error: {e}")


def fetch_history(hours: int = 24, limit: int = 2000) -> list[dict]:
    """
    Return readings from the last `hours`, ordered oldest -> newest.
    Returns [] if Supabase isn't configured or on any error.
    """
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
    except Exception as e:  # noqa: BLE001
        print(f"[supabase] history error: {e}")
        return []
