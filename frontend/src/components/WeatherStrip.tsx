import React from 'react';
import { CloudRain } from 'lucide-react';
import { WeatherForecast } from '../types';

interface Props {
  forecast: WeatherForecast[];
}

const WeatherStrip: React.FC<Props> = ({ forecast }) => {
  const rainAlert = forecast.find(f => f.rainProbability >= 60);

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Weather Forecast
        </h3>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Next 15 hours</span>
      </div>

      {/* Rain alert banner */}
      {rainAlert && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'rgba(91, 191, 239, 0.08)',
          border: '1px solid rgba(91, 191, 239, 0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          marginBottom: '16px',
        }}>
          <CloudRain size={14} color="var(--blue)" />
          <span style={{ fontSize: '12px', color: 'var(--blue)', fontWeight: 500 }}>
            Rain expected at {rainAlert.time} ({rainAlert.rainProbability}% probability) — irrigation may be auto-paused
          </span>
        </div>
      )}

      {/* Forecast grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
        {forecast.map((item, i) => (
          <div key={i} style={{
            background: i === 0 ? 'var(--accent-muted)' : 'var(--bg-surface)',
            border: `1px solid ${i === 0 ? 'rgba(93,234,138,0.2)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '12px 8px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '10px', color: i === 0 ? 'var(--accent-primary)' : 'var(--text-muted)', marginBottom: '6px', fontWeight: i === 0 ? 600 : 400 }}>
              {item.time}
            </div>
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>{item.icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {item.temp}°
            </div>
            {/* Rain probability bar */}
            <div style={{ height: '3px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden', marginBottom: '4px' }}>
              <div style={{
                height: '100%',
                width: `${item.rainProbability}%`,
                background: item.rainProbability > 60 ? 'var(--blue)' : item.rainProbability > 30 ? 'var(--amber)' : 'var(--accent-secondary)',
                borderRadius: '2px',
              }} />
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{item.rainProbability}%</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherStrip;
