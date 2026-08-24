// Shared display configuration and helpers.
//
// No mock readings live here — every sensor value in the app comes from the
// live device via useLiveData(). This module only holds static presentation
// config (colours, thresholds, labels) that is the same regardless of data.

export type SensorStatus = 'optimal' | 'warning' | 'critical';

// Status colours, aligned to the app's theme tokens.
export const getStatusColor = (status: SensorStatus): string => {
  switch (status) {
    case 'optimal':
      return 'var(--accent-primary)';
    case 'warning':
      return 'var(--amber)';
    case 'critical':
      return 'var(--red)';
  }
};

// Firmware hysteresis thresholds (see agrosense_firmware.ino). The pump turns
// on at/below RELAY_ON and off at/above RELAY_OFF.
export const RELAY_ON_THRESHOLD = 60;
export const RELAY_OFF_THRESHOLD = 75;

// Per-metric display metadata used by the dashboard and sensor pages.
export interface SensorMeta {
  key: 'temperature' | 'humidity' | 'soilMoisture';
  label: string;
  unit: string;
  color: string;
  // Sensible axis range for charts
  min: number;
  max: number;
}

export const SENSOR_META: Record<SensorMeta['key'], SensorMeta> = {
  temperature: { key: 'temperature', label: 'Temperature', unit: '°C', color: 'var(--amber)', min: 0, max: 50 },
  humidity: { key: 'humidity', label: 'Humidity', unit: '%', color: 'var(--blue)', min: 0, max: 100 },
  soilMoisture: { key: 'soilMoisture', label: 'Soil Moisture', unit: '%', color: 'var(--accent-primary)', min: 0, max: 100 },
};
