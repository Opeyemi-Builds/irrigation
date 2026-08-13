# 🌱 [Project Name TBD] — Smart Irrigation System

> An intelligent, sensor-driven irrigation platform for modern farmers. Monitors temperature, humidity, and soil moisture in real time — and uses AI and weather forecasting to decide when (and when *not*) to water your crops.

---

## What This Is

This is a full-stack smart irrigation system built for farmers who want to stop guessing and start growing smarter. The system pulls live data from field sensors, checks the weather forecast, and uses an AI advisor to recommend irrigation actions — automatically holding off if rain is coming.

This repo contains both the **frontend** (React + TypeScript) and a placeholder for the **backend** (FastAPI + Python).

---

## Project Structure

```
no-name/
├── frontend/               # React + TypeScript dashboard
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── AIAdvisor.tsx        # Chat-based AI farming advisor
│   │   │   ├── CombinedChart.tsx    # Multi-sensor trend graphs
│   │   │   ├── IrrigationZones.tsx  # Zone status & moisture bars
│   │   │   ├── SensorCard.tsx       # Individual sensor widget w/ sparkline
│   │   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   │   └── WeatherStrip.tsx     # 15-hour weather forecast strip
│   │   ├── data/
│   │   │   └── mockData.ts          # Mock sensor & forecast data (dev)
│   │   ├── pages/
│   │   │   └── Dashboard.tsx        # Main dashboard layout
│   │   ├── types/
│   │   │   └── index.ts             # Shared TypeScript interfaces
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css               # Design tokens & global styles
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── backend/                # FastAPI backend (in progress)
    └── README.md
```

---

## Frontend Features

### 📊 Live Sensor Dashboard
Three sensor cards — **Temperature**, **Humidity**, and **Soil Moisture** — each showing the current reading, status badge (Optimal / Warning / Critical), trend direction, and a 24-hour sparkline chart.

### 📈 Sensor Trend Graphs
A combined multi-line chart for all three sensors with toggleable lines and time range selector (6h / 12h / 24h). Built with Recharts.

### 💧 Irrigation Zones
A zone management panel showing all irrigation areas with:
- Active / Idle / Scheduled / Paused status
- Per-zone soil moisture bars
- Last irrigated time and next scheduled cycle
- Field area (hectares)

### 🌦️ Weather Forecast Strip
A 6-slot hourly forecast showing temperature, condition icon, and a rain probability bar. Displays an alert banner when rain is expected within the forecast window — the backend will use this to pause irrigation automatically.

### 🤖 AI Farm Advisor
An in-dashboard chat interface that gives farmers contextual advice based on sensor readings and weather data. Supports quick-prompt suggestions for common questions like water requirements, soil health, and scheduling.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 |
| Language | TypeScript |
| Build Tool | Vite |
| Charts | Recharts |
| Icons | Lucide React |
| Date Handling | date-fns |
| Fonts | Syne (display) + DM Sans (body) |
| Styling | Pure CSS with custom properties (no Tailwind) |

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- npm v9 or higher

### Install & Run

```bash
# Clone the repo (once named)
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
```

Output goes to `frontend/dist/`.

---

## Backend (Planned)

The backend will be built with **FastAPI** and handle:

- **Sensor data ingestion** — REST endpoints to receive readings from IoT sensors in the field
- **Weather API integration** — Fetches forecasts and flags rain events within a configurable window (default: 3 hours)
- **Smart irrigation logic** — Decides whether to irrigate based on soil moisture thresholds and upcoming rainfall
- **AI advisory API** — Connects the chat advisor to a live language model with sensor context injected into the system prompt
- **Scheduling engine** — Manages zone irrigation schedules and overrides

To run the backend (once implemented):

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## Environment Variables

Once the backend is live, the frontend will need:

```env
# frontend/.env.local
VITE_API_BASE_URL=http://localhost:8000
VITE_WEATHER_API_KEY=your_openweathermap_key
```

---

## Design System

The UI uses a dark green-tinted theme (`--bg-base: #0a0f0d`) built around an agricultural identity. Key design tokens are defined in `src/index.css` as CSS custom properties:

- `--accent-primary: #5dea8a` — primary green accent
- `--font-display: 'Syne'` — headings and numbers
- `--font-body: 'DM Sans'` — body text and UI labels

All components use these tokens directly, making theme changes a single-file edit.

---

## Roadmap

- [x] Frontend dashboard with mock data
- [x] Sensor sparkline cards
- [x] Multi-sensor trend chart
- [x] Irrigation zone panel
- [x] Weather forecast strip with rain alert
- [x] AI advisor chat UI
- [ ] FastAPI backend scaffold
- [ ] Real sensor WebSocket feed
- [ ] Weather API integration (OpenWeatherMap)
- [ ] Smart irrigation scheduling engine
- [ ] AI advisor connected to live LLM + sensor context
- [ ] Mobile-responsive layout
- [ ] User authentication
- [ ] Alerts & notification system

---

## Contributing

This project is in early development. Once the name is decided and the repo is public, contribution guidelines will be added here.

---

## License

TBD — will be defined once the project is named and open-sourced.

---

*Built for farmers. Designed to be smart, not complicated.*
