# Deployment

AgroSense runs on free tiers end to end: the API on **Render**, the dashboard on **Vercel**, and the ESP32 posting to the Render URL over HTTPS. This guide covers the full path plus the optional database and AI features.

```
ESP32  ──HTTPS POST──▶  Render (FastAPI)  ──GET /live──▶  Vercel (React)
                              │
                              └─ optional ─▶ Supabase (history)
```

---

## 1 · Backend on Render

The repository ships a `render.yaml` blueprint at its root, so Render provisions the service for you.

1. Push the repository to GitHub.
2. In the Render dashboard: **New → Blueprint**, then connect the repository. Render reads `render.yaml` and creates a web service named `agrosense-api`.
3. When prompted for the environment variables (`ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `OPENWEATHER_API_KEY`, `FRONTEND_URL`), **leave them blank to start** — the service runs on in-memory data without them. Add them later to enable the extra features (below).
4. Wait for the build and deploy to finish, then copy the service URL, e.g. `https://agrosense-api-xxxx.onrender.com`.

**Verify:**

```bash
curl https://<your-service>.onrender.com/health
# → {"status":"ok","service":"AgroSense API"}
```

Interactive API docs are at `https://<your-service>.onrender.com/docs`.

> **Python version.** Render's current default Python has no prebuilt wheel for `pydantic-core`, so the build is pinned to **3.12.7** via both `render.yaml` (`PYTHON_VERSION`) and `backend/.python-version`. Keep that pin.

> **Free-tier sleep.** The instance sleeps after ~15 minutes idle; the first request then takes ~50 s to wake. The device posts every 5 s, so once it's running the service stays warm.

### Manual setup (without the blueprint)

Create a **Web Service** from the repo with:

- **Root directory:** `backend`
- **Build command:** `pip install -r requirements.txt`
- **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Health check path:** `/health`
- **Environment variable:** `PYTHON_VERSION = 3.12.7`

---

## 2 · Frontend on Vercel

1. In Vercel: **Add New → Project**, then import the repository.
2. Set **Root Directory** to `frontend`. The framework preset is **Vite** (build `npm run build`, output `dist`).
3. Under **Settings → Environment Variables**, add:

   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://<your-service>.onrender.com` |

   Apply it to **Production** (and Preview, if you use preview deploys).
4. Deploy.

> **Rebuild after changing the variable.** Vite inlines `VITE_*` variables into the bundle at **build time**, so a value added or changed after a build has no effect until you **redeploy** (Deployments → latest → ⋯ → Redeploy). This is the most common reason a deployed dashboard shows no data.

CORS is open on the backend (`allow_origins=["*"]`), so no extra configuration is needed for the Vercel origin to reach Render.

---

## 3 · Field device

In [`firmware/agrosense_firmware.ino`](../firmware/agrosense_firmware.ino), set your Wi-Fi credentials and the telemetry URL, then flash:

```cpp
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* api_url  = "https://<your-service>.onrender.com/api/v1/sensors/telemetry";
```

A standard HTTPS host like Render handshakes cleanly with the ESP32. Watch the Serial Monitor (115200 baud) for `POST 200`. See [`firmware/README.md`](../firmware/README.md) for wiring and troubleshooting.

---

## Verify the whole pipeline

```bash
BASE=https://<your-service>.onrender.com

# 1. API is up
curl $BASE/health

# 2. Simulate a device reading
curl -X POST $BASE/api/v1/sensors/telemetry \
  -H "Content-Type: application/json" \
  -d '{"temperature":28.5,"humidity":65,"soil_moisture":42,"water_level_cm":12,"pump_status":true,"is_charging":false}'

# 3. Read it back — what the dashboard polls
curl $BASE/api/v1/sensors/live
```

If step 3 returns `"connected": true` with your reading, the backend is good. Open the Vercel URL, log in (demo: `demo@agrosense.app` / `agrosense`), and the dashboard should show the same values.

---

## Optional features

### History (Supabase)
Create a free Supabase project and the `sensor_readings` table (schema in [`backend/README.md`](../backend/README.md)). Add `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` to the Render service and redeploy. The service-role key is secret — set it only on the backend, never in Vercel. Telemetry responses then return `"stored": true`.

### AI advisor chat (Claude)
Add `ANTHROPIC_API_KEY` to the Render service to enable `POST /api/v1/ai/chat`. The dashboard's built-in advisor works without this; the key only powers the server-side Claude endpoint.

---

## Local development

Run the backend locally and point the dashboard at it:

```bash
# backend
cd backend && uvicorn main:app --reload            # http://localhost:8000

# frontend
cd frontend
echo "VITE_API_BASE_URL=http://localhost:8000" > .env.local
npm run dev                                         # http://localhost:5173
```

To let a physical ESP32 reach a locally running backend, put the device and PC on the same Wi-Fi and set `api_url` to your PC's LAN IP over plain HTTP (`http://192.168.x.x:8000/api/v1/sensors/telemetry`) — this avoids TLS on the device entirely. Public HTTPS tunnels are an alternative, but note that some tunnel edges (e.g. ngrok) reject the ESP32's TLS handshake even when browsers connect fine; for a hosted setup, the Render URL is the reliable path.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Deployed dashboard shows no data | `VITE_API_BASE_URL` unset in Vercel, or set but not redeployed. Add it and redeploy. |
| First request to Render hangs ~50 s | Free-tier cold start; it wakes and stays warm while the device posts. |
| `stored: false` in telemetry response | Supabase not configured — expected unless you added the keys. |
| Device SSL error `-29312` | TLS handshake rejected by the host (common with ngrok). Use the Render URL. |
