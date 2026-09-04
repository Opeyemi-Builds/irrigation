import React from 'react';
import { Thermometer, Droplets, Leaf, RefreshCw } from 'lucide-react';
import SensorCard from '../components/SensorCard';
import IrrigationZones from '../components/IrrigationZones';
import WeatherStrip from '../components/WeatherStrip';
import CombinedChart from '../components/CombinedChart';
import AIAdvisor from '../components/AIAdvisor';
import Reservoir3D from '../components/Reservoir3D';
import DeviceStatusBar from '../components/DeviceStatusBar';
import PumpControl from '../components/PumpControl';
import { useLiveData } from '../hooks/useLiveData';
import { getFarmProfile, buildZones, cropsLabel } from '../lib/farm';
import { useIsMobile } from '../hooks/useIsMobile';
import { format } from 'date-fns';
import { SensorData, SensorReading } from '../types';

// Wrap a live scalar + its real history into the SensorData shape SensorCard expects.
function toSensorData(current: number | null, unit: string, history: SensorReading[]): SensorData {
  if (current == null) {
    return { current: null, unit, status: 'optimal', trend: 'stable', history };
  }

  const last = history[history.length - 1]?.value ?? current;
  const prev = history[history.length - 4]?.value ?? last;
  const trend: 'up' | 'down' | 'stable' =
    current > prev + 0.5 ? 'up' : current < prev - 0.5 ? 'down' : 'stable';

  let status: 'optimal' | 'warning' | 'critical' = 'optimal';
  if (unit === '%' && current < 30) status = 'critical';
  else if (unit === '%' && current < 40) status = 'warning';
  else if (unit === '°C' && (current > 38 || current < 10)) status = 'critical';
  else if (unit === '°C' && (current > 35 || current < 15)) status = 'warning';

  return { current, unit, status, trend, history };
}

const Dashboard: React.FC = () => {
  const live = useLiveData();
  const isMobile = useIsMobile();
  const profile = getFarmProfile();
  const cropsText = profile?.crops?.length ? cropsLabel(profile) : '';

  const toReadings = (key: 'temperature' | 'humidity' | 'soilMoisture'): SensorReading[] =>
    live.history
      .filter(p => p[key] != null)
      .map(p => ({ timestamp: p.timestamp, value: p[key] as number }));

  const tempData = toSensorData(live.temperature, '°C', toReadings('temperature'));
  const humData = toSensorData(live.humidity, '%', toReadings('humidity'));
  const soilData = toSensorData(live.soilMoisture, '%', toReadings('soilMoisture'));

  const zones = buildZones(
    { soilMoisture: live.soilMoisture, pumpStatus: live.pumpStatus, hasData: live.hasData },
    profile,
  );

  const reservoirStatus = live.pumpStatus ? 'draining' : 'idle';

  return (
    <div style={{ padding: isMobile ? '18px 16px 32px' : '28px 32px', overflowY: 'auto', height: isMobile ? 'auto' : '100vh', minHeight: isMobile ? '100%' : undefined }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: '4px' }}>
            Farm Overview
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {live.hasData && live.lastUpdated
              ? `Live · updated ${format(new Date(live.lastUpdated), 'HH:mm:ss')}`
              : 'Waiting for your device to send readings'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {profile && (
            <div data-tour="farm" style={{ background: 'var(--accent-muted)', border: '1px solid var(--accent-glow)', borderRadius: 'var(--radius-sm)', padding: '6px 14px', fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Leaf size={13} />
              {profile.farmName?.trim() || 'My Farm'}{cropsText ? ` · ${cropsText}` : ''}
            </div>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', transition: 'border-color 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-primary)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* Device status bar */}
      <DeviceStatusBar
        deviceConnected={live.deviceConnected}
        hasData={live.hasData}
        lastUpdated={live.lastUpdated}
        pumpStatus={live.pumpStatus}
        isCharging={live.isCharging}
      />

      {/* Sensor cards */}
      <div data-tour="sensors" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <SensorCard title="Temperature"   icon={<Thermometer size={16} strokeWidth={2} />} data={tempData} color="#ff7c5e" delay={0} />
        <SensorCard title="Humidity"      icon={<Droplets size={16} strokeWidth={2} />}   data={humData}  color="#5bbfef" delay={80} />
        <SensorCard title="Soil Moisture" icon={<Leaf size={16} strokeWidth={2} />}       data={soilData} color="#5dea8a" delay={160} />
      </div>

      {/* Pump control — the full control also lives on the Irrigation page; shown
          here too so the pump is always one click from the overview */}
      <div data-tour="pump">
        <PumpControl
          mode={live.pumpCommand ?? 'auto'}
          pumpOn={live.pumpStatus}
          connected={live.deviceConnected}
          linked={live.deviceLinked}
          onChange={live.setPumpMode}
        />
      </div>

      {/* Reservoir + AI */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '340px 1fr', gap: '16px', marginBottom: '20px' }}>
        <Reservoir3D level={live.reservoirPct} status={reservoirStatus} />
        <div data-tour="advisor" style={{ minWidth: 0 }}>
          <AIAdvisor />
        </div>
      </div>

      {/* Chart */}
      <div style={{ marginBottom: '20px' }}>
        <CombinedChart history={live.history} />
      </div>

      {/* Weather + Zones */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
        <WeatherStrip forecast={[]} />
        <IrrigationZones zones={zones} />
      </div>
    </div>
  );
};

export default Dashboard;
