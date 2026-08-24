import React from 'react';
import { CloudOff, Thermometer, Droplets, Leaf, Waves, Info } from 'lucide-react';
import { useLiveData } from '../hooks/useLiveData';
import { getFarmProfile, getCropInfo } from '../lib/farm';
import { useIsMobile } from '../hooks/useIsMobile';
import EmptyState from '../components/EmptyState';

const ConditionCard: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string }> = ({ icon, label, value, color }) => (
  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', flex: 1, minWidth: '160px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
      <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${color}18`, border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        {icon}
      </div>
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
    </div>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, color: value === '—' ? 'var(--text-muted)' : 'var(--text-primary)', letterSpacing: '-1px' }}>
      {value}
    </div>
  </div>
);

const Weather: React.FC = () => {
  const live = useLiveData();
  const isMobile = useIsMobile();
  const profile = getFarmProfile();
  const crop = getCropInfo(profile?.crop);

  return (
    <div style={{ padding: isMobile ? '18px 16px 32px' : '28px 32px', overflowY: 'auto', height: isMobile ? 'auto' : '100vh', minHeight: isMobile ? '100%' : undefined }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: '4px' }}>
          Weather
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          On-site conditions and local forecast for irrigation planning
        </p>
      </div>

      {/* On-site conditions (real, from the device) */}
      <div style={{ marginBottom: '10px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>On-site conditions</span>
      </div>
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <ConditionCard icon={<Thermometer size={16} />} label="Air Temperature" value={live.temperature != null ? `${live.temperature}°C` : '—'} color="#ff7c5e" />
        <ConditionCard icon={<Droplets size={16} />} label="Humidity" value={live.humidity != null ? `${live.humidity}%` : '—'} color="#5bbfef" />
        <ConditionCard icon={<Leaf size={16} />} label="Soil Moisture" value={live.soilMoisture != null ? `${live.soilMoisture}%` : '—'} color="#5dea8a" />
        <ConditionCard icon={<Waves size={16} />} label="Reservoir" value={live.reservoirPct != null ? `${live.reservoirPct}%` : '—'} color="#5bbfef" />
      </div>

      {/* Humidity insight (only when we actually have a reading) */}
      {live.humidity != null && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: '24px',
        }}>
          <Info size={15} color="var(--accent-primary)" style={{ marginTop: '1px', flexShrink: 0 }} />
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {live.humidity >= 80
              ? `On-site humidity is high (${live.humidity}%). Soil loses water slowly in humid air, but dense foliage stays wet longer — water at the base and keep airflow good${crop ? ` to limit ${crop.watch}` : '.'}`
              : live.humidity < 50
                ? `On-site humidity is low (${live.humidity}%). Dry air makes plants transpire faster, so expect the soil to dry a little sooner than usual.`
                : `On-site humidity is comfortable (${live.humidity}%). No weather-related action needed right now.`}
          </p>
        </div>
      )}

      {/* Forecast — not connected yet */}
      <div style={{ marginBottom: '10px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Forecast</span>
      </div>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
        <EmptyState
          icon={<CloudOff size={22} />}
          title="Weather forecast not connected"
          message="Once a weather source is linked to your account, the local hourly forecast and rain-based irrigation advice will appear here. For now, planning uses the on-site sensor readings above."
        />
      </div>
    </div>
  );
};

export default Weather;
