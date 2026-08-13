import React from 'react';
import { Thermometer, Droplets, Leaf, RefreshCw } from 'lucide-react';
import SensorCard from '../components/SensorCard';
import IrrigationZones from '../components/IrrigationZones';
import WeatherStrip from '../components/WeatherStrip';
import CombinedChart from '../components/CombinedChart';
import AIAdvisor from '../components/AIAdvisor';
import Reservoir3D from '../components/Reservoir3D';
import DeviceStatusBar from '../components/DeviceStatusBar';
import { useLiveData } from '../hooks/useLiveData';
import { mockDashboardData } from '../data/mockData';
import { format } from 'date-fns';
import { SensorData } from '../types';

// Wrap a live scalar into the SensorData shape SensorCard expects
function toLiveSensorData(current: number, unit: string, history: { timestamp: string; value: number }[]): SensorData {
  const sorted = [...history];
  const last = sorted[sorted.length - 1]?.value ?? current;
  const prev = sorted[sorted.length - 3]?.value ?? current;
  const trend: 'up' | 'down' | 'stable' =
    current > prev + 0.5 ? 'up' : current < prev - 0.5 ? 'down' : 'stable';

  let status: 'optimal' | 'warning' | 'critical' = 'optimal';
  if (unit === '%' && current < 30) status = 'critical';
  else if (unit === '%' && current < 40) status = 'warning';
  else if (unit === '°C' && (current > 38 || current < 10)) status = 'critical';
  else if (unit === '°C' && (current > 35 || current < 15)) status = 'warning';

  return { current, unit, status, trend, history: sorted };
}

const Dashboard: React.FC = () => {
  const live = useLiveData();
  const mock = mockDashboardData;

  // Build sensor data objects — live values override mock history
  const tempData    = toLiveSensorData(live.temperature,  '°C', mock.temperature.history);
  const humData     = toLiveSensorData(live.humidity,     '%',  mock.humidity.history);
  const soilData    = toLiveSensorData(live.soilMoisture, '%',  mock.soilMoisture.history);

  // Reservoir status
  const reservoirStatus = live.pumpStatus ? 'draining' : 'idle';

  return (
    <div style={{ padding: '28px 32px', overflowY: 'auto', height: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: '4px' }}>
            Farm Overview
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {live.usingMockData ? 'Demo mode · connect device for live data' : `Live · updated ${format(new Date(live.lastUpdated), 'HH:mm:ss')}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ background: 'var(--accent-muted)', border: '1px solid rgba(93,234,138,0.2)', borderRadius: 'var(--radius-sm)', padding: '6px 14px', fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600 }}>
            💧 {mock.waterSaved.toLocaleString()}L saved this week
          </div>
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
        usingMockData={live.usingMockData}
        statusMessage={live.statusMessage}
        lastUpdated={live.lastUpdated}
        pumpStatus={live.pumpStatus}
        isCharging={live.isCharging}
      />

      {/* Sensor cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <SensorCard title="Temperature"   icon={<Thermometer size={16} strokeWidth={2} />} data={tempData} color="#ff7c5e" delay={0} />
        <SensorCard title="Humidity"      icon={<Droplets size={16} strokeWidth={2} />}   data={humData}  color="#5bbfef" delay={80} />
        <SensorCard title="Soil Moisture" icon={<Leaf size={16} strokeWidth={2} />}       data={soilData} color="#5dea8a" delay={160} />
      </div>

      {/* Reservoir + AI */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '16px', marginBottom: '20px' }}>
        <Reservoir3D
          level={live.reservoirPct}
          capacity={5000}
          flowRate={140}
          status={reservoirStatus}
        />
        <AIAdvisor
          liveTemperature={live.temperature}
          liveHumidity={live.humidity}
          liveSoilMoisture={live.soilMoisture}
          liveReservoirPct={live.reservoirPct}
          pumpStatus={live.pumpStatus}
        />
      </div>

      {/* Chart */}
      <div style={{ marginBottom: '20px' }}>
        <CombinedChart data={mock} />
      </div>

      {/* Weather + Zones */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
        <WeatherStrip forecast={mock.forecast} />
        <IrrigationZones zones={mock.zones} />
      </div>
    </div>
  );
};

export default Dashboard;
