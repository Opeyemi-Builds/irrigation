export interface SensorReading {
  timestamp: string;
  value: number;
}

export interface SensorData {
  current: number | null;
  unit: string;
  status: 'optimal' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  history: SensorReading[];
}

export interface IrrigationZone {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'scheduled' | 'paused';
  moisture: number | null;
  lastIrrigated: string | null;
  nextScheduled: string | null;
  area: number | null; // hectares
  linked: boolean; // true when a real device backs this zone
}

export interface WeatherForecast {
  time: string;
  condition: string;
  temp: number;
  humidity: number;
  rainProbability: number;
  icon: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// A single point in the live history buffer (built from real readings only).
export interface HistoryPoint {
  timestamp: string;
  temperature: number | null;
  humidity: number | null;
  soilMoisture: number | null;
}

// ── Live sensor data from backend ────────────────────────────────────────────
export interface LiveSensorData {
  temperature: number;
  humidity: number;
  soil_moisture: number;
  water_level_cm: number;
  reservoir_pct: number;
  pump_status: boolean;
  is_charging: boolean;
  received_at: string;
}

// Pump control mode. "auto" = on-device soil-moisture hysteresis; "on"/"off" =
// manual override set from the dashboard.
export type PumpMode = 'auto' | 'on' | 'off';

export interface LiveDataResponse {
  connected: boolean;
  data: LiveSensorData | null;
  message: string;
  pump_command?: PumpMode;
  linked?: boolean; // is this farm's Product ID attached to the physical device?
}
