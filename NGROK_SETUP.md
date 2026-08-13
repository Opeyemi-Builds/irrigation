# AgroSense — Full Setup & ngrok Guide

## What ngrok does
ngrok gives your locally running backend a public HTTPS URL so:
- The ESP32 (on any WiFi) can POST sensor data to it
- Anyone on any network can open the dashboard and see live data
- No server, no deployment, no cost

---

## Step 1 — Install ngrok

Go to **https://ngrok.com**, create a free account, then:

**Windows:**
Download the .exe from the ngrok dashboard and add it to your PATH

**Mac:**
```bash
brew install ngrok/ngrok/ngrok
```

**Linux:**
```bash
curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.deb | sudo dpkg -i -
```

Then authenticate (one time only):
```bash
ngrok config add-authtoken YOUR_NGROK_AUTHTOKEN
```
(Find your authtoken at dashboard.ngrok.com → Your Authtoken)

---

## Step 2 — Start everything (do this in order)

### Terminal 1 — Backend
```bash
cd no-name/backend
source venv/bin/activate        # Windows: venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

### Terminal 2 — ngrok tunnel for backend
```bash
ngrok http 8000
```
You'll see output like:
```
Forwarding   https://a1b2-102-89-23-14.ngrok-free.app -> http://localhost:8000
```
**Copy that https URL** — you need it in two places.

### Terminal 3 — Frontend
```bash
cd no-name/frontend
npm run dev
```

---

## Step 3 — Update frontend with ngrok URL

Open `no-name/frontend/.env.local` and set:
```
VITE_API_BASE_URL=https://a1b2-102-89-23-14.ngrok-free.app
```
Then restart the frontend (`Ctrl+C` → `npm run dev`).

Now anyone can open `http://localhost:5173` on YOUR machine and see live data.

---

## Step 4 — Make the frontend publicly accessible too (optional)

### Terminal 4 — ngrok tunnel for frontend
```bash
ngrok http 5173
```
Share that URL with anyone — supervisors, examiners, teammates.
They'll see the full live dashboard from anywhere in the world.

---

## Step 5 — Update the firmware

In `firmware/agrosense_firmware.ino`, update these three lines:
```cpp
const char* ssid     = "YOUR_ACTUAL_WIFI_NAME";
const char* password = "YOUR_ACTUAL_WIFI_PASSWORD";
const char* api_url  = "https://a1b2-102-89-23-14.ngrok-free.app/api/v1/sensors/telemetry";
```
Flash to your ESP32. It will immediately start POSTing to the backend.

---

## Verify everything is working

1. Backend health: `https://YOUR-NGROK-URL.ngrok-free.app/health` → should return `{"status":"ok"}`
2. Live data: `https://YOUR-NGROK-URL.ngrok-free.app/api/v1/sensors/live` → should show sensor readings
3. Dashboard: open frontend, top bar should show **Live** in green with pump status

---

## ⚠️ Important: ngrok URL changes every restart

Every time you restart ngrok, you get a NEW URL. You must:
1. Update `frontend/.env.local` with the new URL
2. Update the firmware `api_url` and reflash the ESP32

**Pro tip for demo day:** Start ngrok first, copy the URL, update everything,
then don't restart ngrok until after the demo.

Free ngrok accounts get one tunnel at a time and URLs change on restart.
If you want a permanent URL, upgrade to the paid plan (~$8/month) or use
their free static domain (one free static domain per account since 2024).

Get your free static domain at: dashboard.ngrok.com → Domains → New Domain

---

## Recap — 4 terminals for full demo

| Terminal | Command | Purpose |
|---|---|---|
| 1 | `uvicorn main:app --reload` | FastAPI backend |
| 2 | `ngrok http 8000` | Expose backend publicly |
| 3 | `npm run dev` | Frontend dev server |
| 4 | `ngrok http 5173` | Expose frontend publicly (optional) |
