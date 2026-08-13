export interface SensorReading {
  timestamp: string;
  value: number;
}

export interface SensorData {
  current: number;
  unit: string;
  status: 'optimal' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  history: SensorReading[];
}

export interface IrrigationZone {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'scheduled' | 'paused';
  moisture: number;
  lastIrrigated: string;
  nextScheduled: string;
  area: number; // hectares
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

export interface DashboardData {
  temperature: SensorData;
  humidity: SensorData;
  soilMoisture: SensorData;
  zones: IrrigationZone[];
  forecast: WeatherForecast[];
  systemStatus: 'all-good' | 'attention' | 'alert';
  waterSaved: number;
  lastUpdated: string;
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

export interface LiveDataResponse {
  connected: boolean;
  data: LiveSensorData | null;
  message: string;
}
