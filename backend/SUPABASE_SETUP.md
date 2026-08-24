# AgroSense — Database (Supabase) Setup

The backend now saves every ESP32 reading to **Supabase** and can serve
historical data. Follow these steps once to turn it on. Until you do, the
backend keeps working on in-memory data exactly like before (no crash).

---

## 1. Create the Supabase project
1. Go to <https://supabase.com> → sign in → **New project**.
2. Give it a name (e.g. `agrosense`), set a database password, pick a region
   close to you, and create it. Wait ~1 minute for it to provision.

## 2. Create the table
In the Supabase dashboard: **SQL Editor → New query**, paste the block below,
then click **Run**.

```sql
-- Telemetry history from the ESP32
create table if not exists public.sensor_readings (
  id             bigint generated always as identity primary key,
  device_id      text        not null default 'esp32-1',
  temperature    double precision,
  humidity       double precision,
  soil_moisture  double precision,
  water_level_cm double precision,
  reservoir_pct  double precision,
  pump_status    boolean,
  is_charging    boolean,
  received_at    timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

-- Fast "last N hours" lookups for the charts
create index if not exists sensor_readings_received_at_idx
  on public.sensor_readings (received_at desc);

-- Lock the table down. The backend uses the service_role key, which bypasses
-- RLS, so it still works. With RLS on and no policies, nobody else can touch it.
alter table public.sensor_readings enable row level security;
```

## 3. Copy your keys
In the dashboard: **Project Settings → API**. Copy:
- **Project URL** → this is `SUPABASE_URL`
- **`service_role`** secret (under *Project API keys*) → this is `SUPABASE_SERVICE_KEY`

> ⚠️ The `service_role` key can read/write everything. Keep it secret — it lives
> only in the backend `.env`. Never put it in the frontend or commit it.

## 4. Add the keys to the backend
Open `backend/.env` (create it from `.env.example` if it doesn't exist) and set:

```env
ANTHROPIC_API_KEY=sk-ant-...          # your existing key
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOi...    # the service_role key
```

## 5. Restart the backend
```bash
cd no-name/backend
venv\Scripts\activate          # Windows
uvicorn main:app --reload --port 8000
```
(Keep your ngrok tunnel pointed at port 8000 as before.)

---

## 6. Verify the whole pipe works
With the backend running (and ngrok up), send one fake reading — this stands in
for the ESP32:

```bash
curl -X POST "https://defensibly-noninfallible-jamika.ngrok-free.dev/api/v1/sensors/telemetry" ^
  -H "Content-Type: application/json" ^
  -H "ngrok-skip-browser-warning: true" ^
  -d "{\"temperature\":28.5,\"humidity\":62,\"soil_moisture\":41,\"water_level_cm\":12,\"pump_status\":false,\"is_charging\":true}"
```
Expected response: `{"status":"ok", ... ,"stored":true}` — `stored:true` means it
saved to Supabase.

Then confirm it persisted:
- **Supabase → Table Editor → `sensor_readings`** — you should see the row.
- History API: open
  `https://defensibly-noninfallible-jamika.ngrok-free.dev/api/v1/sensors/history?hours=1`
  → should show `"count": 1` and the reading.

---

## 7. Point the deployed frontend at the backend  ← don't skip
Your deployed frontend must know the backend URL. In your frontend host
(Vercel/Netlify/etc.) set the environment variable:

```
VITE_API_BASE_URL=https://defensibly-noninfallible-jamika.ngrok-free.dev
```
then **redeploy** the frontend. Without this it defaults to `localhost:8000` and
can't reach your backend.

## 8. Flash the ESP32
The firmware's `api_url` is already fixed to the correct full path
(`.../api/v1/sensors/telemetry`). Set your real Wi-Fi name/password at the top of
`firmware/agrosense_firmware.ino`, flash the board, and it will start POSTing.

---

## Notes
- **ngrok must stay running** on your PC for the site to receive data. If your PC
  sleeps or ngrok stops, data flow stops. To run the backend 24/7 without your PC,
  see `render.yaml` and deploy to Render — then use the Render URL everywhere
  instead of the ngrok URL (firmware `api_url` + frontend `VITE_API_BASE_URL`).
- The history charts on the dashboard still show demo data — wiring them to this
  new `/history` endpoint is a small frontend follow-up (out of scope for this pass).
