import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { LiveSensorData, LiveDataResponse, HistoryPoint, PumpMode } from '../types';
import { getFarmProfile } from '../lib/farm';

const API_BASE = (import.meta as any).env.VITE_API_BASE_URL || '';
const POLL_INTERVAL = 3000; // 3 seconds
const MAX_HISTORY = 240;

// The Product ID of the farm currently signed in, read fresh from the saved
// profile. It scopes /live + /command so a farm only sees its own device (only
// IDs attached to the hardware — 0001, 0002 — get live data).
function currentProductId(): string | null {
  return getFarmProfile()?.productId ?? null;
}

export interface LiveData {
  // Sensor values — null until a real reading arrives. No mock fallback.
  temperature: number | null;
  humidity: number | null;
  soilMoisture: number | null;
  reservoirPct: number | null;
  waterLevelCm: number | null;
  pumpStatus: boolean | null;
  isCharging: boolean | null;
  // Meta
  hasData: boolean; // at least one real reading has been received
  deviceConnected: boolean; // backend reports the device is currently streaming
  deviceLinked: boolean; // this farm's Product ID is attached to the physical device
  lastUpdated: string | null;
  history: HistoryPoint[]; // real readings collected this session, oldest → newest
  liveData: LiveSensorData | null;
  // Pump control — the mode the device is set to, and a setter that commands it.
  pumpCommand: PumpMode | null; // null until the backend reports one
  setPumpMode: (mode: PumpMode) => Promise<void>;
}

const EMPTY: LiveData = {
  temperature: null,
  humidity: null,
  soilMoisture: null,
  reservoirPct: null,
  waterLevelCm: null,
  pumpStatus: null,
  isCharging: null,
  hasData: false,
  deviceConnected: false,
  deviceLinked: true, // assume linked until the backend says otherwise (avoids a flash)
  lastUpdated: null,
  history: [],
  liveData: null,
  pumpCommand: null,
  setPumpMode: async () => {},
};

const LiveDataContext = createContext<LiveData>(EMPTY);

export function LiveDataProvider({ children }: { children: ReactNode }) {
  const [liveData, setLiveData] = useState<LiveSensorData | null>(null);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [deviceLinked, setDeviceLinked] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const lastReceivedAt = useRef<string | null>(null);
  const [pumpCommand, setPumpCommand] = useState<PumpMode | null>(null);

  const poll = useCallback(async () => {
    // No backend configured yet — stay quietly in the "waiting for device"
    // state rather than hammering a URL that doesn't exist.
    if (!API_BASE) {
      setDeviceConnected(false);
      return;
    }
    try {
      // Scope the request to this farm's Product ID so only device-linked farms
      // (0001, 0002) receive live readings.
      const pid = currentProductId();
      const url = pid
        ? `${API_BASE}/api/v1/sensors/live?product_id=${encodeURIComponent(pid)}`
        : `${API_BASE}/api/v1/sensors/live`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(4000),
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      if (!res.ok) throw new Error('bad response');
      const json: LiveDataResponse = await res.json();

      setDeviceConnected(Boolean(json.connected));
      // Whether this farm's Product ID is attached to the physical device. Older
      // backends don't send `linked`; treat a missing value as linked (compat).
      if (typeof json.linked === 'boolean') setDeviceLinked(json.linked);
      // Reflect the pump mode the backend currently holds. Only overwrite when
      // present, so an optimistic value set by setPumpMode survives a response
      // from an older backend that doesn't report it.
      if (json.pump_command) setPumpCommand(json.pump_command);

      if (json.data) {
        const data = json.data;
        setLiveData(data);
        setLastUpdated(new Date().toISOString());

        // Append to the live history buffer, de-duplicating by the reading's
        // own timestamp so a stale/repeated reading doesn't inflate the chart.
        const key = data.received_at || null;
        if (!key || key !== lastReceivedAt.current) {
          lastReceivedAt.current = key;
          setHistory(prev => {
            const point: HistoryPoint = {
              timestamp: data.received_at || new Date().toISOString(),
              temperature: Number.isFinite(data.temperature) ? data.temperature : null,
              humidity: Number.isFinite(data.humidity) ? data.humidity : null,
              soilMoisture: Number.isFinite(data.soil_moisture) ? data.soil_moisture : null,
            };
            const next = [...prev, point];
            return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
          });
        }
      }
    } catch {
      // Device/backend not reachable. Keep any last-known real reading, but
      // mark the device as not currently streaming. No error message, no mock.
      setDeviceConnected(false);
    }
  }, []);

  // Command the pump mode. Updates the UI optimistically, then POSTs to the
  // backend; the ESP32 picks the change up on its next telemetry POST (~5s).
  // On failure we leave the optimistic value — the next /live poll reconciles
  // it with whatever the backend actually holds.
  const setPumpMode = useCallback(async (mode: PumpMode) => {
    setPumpCommand(mode);
    if (!API_BASE) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/sensors/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ mode }),
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) throw new Error('command rejected');
      const json = await res.json();
      if (json?.mode) setPumpCommand(json.mode as PumpMode);
    } catch {
      /* next poll reconciles the UI with the backend's actual command */
    }
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [poll]);

  // One-time: seed the chart with saved history from the backend, so trends
  // aren't empty on a fresh load. Live polling then keeps appending on top.
  useEffect(() => {
    if (!API_BASE) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/sensors/history?hours=24`, {
          signal: AbortSignal.timeout(6000),
        });
        if (!res.ok) return;
        const json = await res.json();
        const readings = Array.isArray(json?.readings) ? json.readings : [];
        if (cancelled || readings.length === 0) return;

        const points: HistoryPoint[] = readings
          .map((r: any) => ({
            timestamp: r.received_at,
            temperature: Number.isFinite(r.temperature) ? r.temperature : null,
            humidity: Number.isFinite(r.humidity) ? r.humidity : null,
            soilMoisture: Number.isFinite(r.soil_moisture) ? r.soil_moisture : null,
          }))
          .slice(-MAX_HISTORY);

        setHistory(prev => {
          // Keep any live points already collected; prepend the saved ones we
          // don't already have, then cap to the buffer size.
          const seen = new Set(prev.map(p => p.timestamp));
          const merged = [...points.filter(p => !seen.has(p.timestamp)), ...prev];
          return merged.length > MAX_HISTORY ? merged.slice(merged.length - MAX_HISTORY) : merged;
        });
        if (!lastReceivedAt.current && points.length) {
          lastReceivedAt.current = points[points.length - 1].timestamp;
        }
      } catch {
        /* saved history is a bonus — live polling works fine without it */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const value: LiveData = {
    temperature: liveData?.temperature ?? null,
    humidity: liveData?.humidity ?? null,
    soilMoisture: liveData?.soil_moisture ?? null,
    reservoirPct: liveData?.reservoir_pct ?? null,
    waterLevelCm: liveData?.water_level_cm ?? null,
    pumpStatus: liveData?.pump_status ?? null,
    isCharging: liveData?.is_charging ?? null,
    hasData: liveData !== null,
    deviceConnected,
    lastUpdated,
    history,
    liveData,
    pumpCommand,
    setPumpMode,
  };

  return <LiveDataContext.Provider value={value}>{children}</LiveDataContext.Provider>;
}

export function useLiveData(): LiveData {
  return useContext(LiveDataContext);
}
