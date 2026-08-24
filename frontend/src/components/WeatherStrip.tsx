import React from 'react';
import { CloudRain, CloudOff, Sun, Cloud, CloudSun, CloudLightning } from 'lucide-react';
import { WeatherForecast } from '../types';
import EmptyState from './EmptyState';

interface Props {
  forecast: WeatherForecast[];
}

// Map a text condition to a themed icon (used only when a real forecast exists).
const conditionIcon = (condition: string, size: number, color: string) => {
  const c = condition.toLowerCase();
  if (c.includes('storm') || c.includes('thunder')) return <CloudLightning size={size} color={color} />;
  if (c.includes('rain') || c.includes('drizzle')) return <CloudRain size={size} color={color} />;
  if (c.includes('cloud') || c.includes('overcast')) return <Cloud size={size} color={color} />;
  if (c.includes('partly') || c.includes('clearing')) return <CloudSun size={size} color={color} />;
  return <Sun size={size} color={color} />;
};

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
        {forecast.length > 0 && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Next 15 hours</span>}
      </div>

      {forecast.length === 0 ? (
        <EmptyState
          compact
          icon={<CloudOff size={22} />}
          title="Weather not connected"
          message="Once a weather source is linked, the local forecast will appear here to help plan irrigation."
        />
      ) : (
        <>
          {rainAlert && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'var(--blue-muted)',
              border: '1px solid var(--blue)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              marginBottom: '16px',
            }}>
              <CloudRain size={14} color="var(--blue)" />
              <span style={{ fontSize: '12px', color: 'var(--blue)', fontWeight: 500 }}>
                Rain expected at {rainAlert.time} ({rainAlert.rainProbability}% probability) — consider pausing irrigation
              </span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
            {forecast.map((item, i) => (
              <div key={i} style={{
                background: i === 0 ? 'var(--accent-muted)' : 'var(--bg-surface)',
                border: `1px solid ${i === 0 ? 'var(--accent-glow)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '12px 8px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '10px', color: i === 0 ? 'var(--accent-primary)' : 'var(--text-muted)', marginBottom: '6px', fontWeight: i === 0 ? 600 : 400 }}>
                  {item.time}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                  {conditionIcon(item.condition, 20, i === 0 ? 'var(--accent-primary)' : 'var(--text-secondary)')}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {item.temp}°
                </div>
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
        </>
      )}
    </div>
  );
};

export default WeatherStrip;
