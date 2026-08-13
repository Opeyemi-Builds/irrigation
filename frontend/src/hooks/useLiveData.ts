import { useState, useEffect, useCallback } from 'react';
import { LiveSensorData, LiveDataResponse } from '../types';
import { mockDashboardData } from '../data/mockData';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const POLL_INTERVAL = 3000; // 3 seconds

export interface UseLiveDataReturn {
  // Sensor values (real or mock)
  temperature: number;
  humidity: number;
  soilMoisture: number;
  reservoirPct: number;
  waterLevelCm: number;
  pumpStatus: boolean;
  isCharging: boolean;
  // Connection meta
  deviceConnected: boolean;
  usingMockData: boolean;
  lastUpdated: string;
  statusMessage: string;
  // Raw live data if available
  liveData: LiveSensorData | null;
}

export function useLiveData(): UseLiveDataReturn {
  const [liveData, setLiveData] = useState<LiveSensorData | null>(null);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [backendReachable, setBackendReachable] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Connecting...');
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/sensors/live`, {
        signal: AbortSignal.timeout(4000),
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      if (!res.ok) throw new Error('bad response');
      const json: LiveDataResponse = await res.json();

      setBackendReachable(true);
      setDeviceConnected(json.connected);
      setStatusMessage(json.message);

      if (json.data) {
        setLiveData(json.data);
        setLastUpdated(new Date().toISOString());
      }
    } catch {
      setBackendReachable(false);
      setDeviceConnected(false);
      setStatusMessage('Backend offline — showing demo data');
    }
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [poll]);

  // ── Resolve values: live > mock ───────────────────────────────────────────
  const usingMockData = !backendReachable || liveData === null;

  const temperature  = liveData?.temperature  ?? mockDashboardData.temperature.current;
  const humidity     = liveData?.humidity     ?? mockDashboardData.humidity.current;
  const soilMoisture = liveData?.soil_moisture ?? mockDashboardData.soilMoisture.current;
  const reservoirPct = liveData?.reservoir_pct ?? 67;
  const waterLevelCm = liveData?.water_level_cm ?? 10;
  const pumpStatus   = liveData?.pump_status   ?? false;
  const isCharging   = liveData?.is_charging   ?? false;

  return {
    temperature,
    humidity,
    soilMoisture,
    reservoirPct,
    waterLevelCm,
    pumpStatus,
    isCharging,
    deviceConnected,
    usingMockData,
    lastUpdated,
    statusMessage,
    liveData,
  };
}
