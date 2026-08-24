import React from 'react';
import { Pause, Clock, CheckCircle } from 'lucide-react';
import { IrrigationZone } from '../types';

// Minus must be defined BEFORE statusConfig
const Minus = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

interface Props {
  zones: IrrigationZone[];
}

const statusConfig = {
  active:    { label: 'Active',    color: 'var(--accent-primary)', bg: 'var(--accent-muted)', Icon: CheckCircle },
  idle:      { label: 'Idle',      color: 'var(--text-muted)',     bg: 'transparent',         Icon: Minus },
  scheduled: { label: 'Scheduled', color: 'var(--blue)',           bg: 'var(--blue-muted)',   Icon: Clock },
  paused:    { label: 'Paused',    color: 'var(--amber)',          bg: 'var(--amber-muted)',  Icon: Pause },
};

const IrrigationZones: React.FC<Props> = ({ zones }) => {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Irrigation Zones
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {zones.map((zone, i) => {
          const cfg = statusConfig[zone.status];
          const StatusIcon = cfg.Icon;
          const hasMoisture = zone.moisture != null;
          const m = zone.moisture ?? 0;
          const moistureColor = m < 40 ? 'var(--amber)' : m > 70 ? 'var(--blue)' : 'var(--accent-primary)';
          return (
            <div
              key={zone.id}
              className="fade-up"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: '14px',
                animationDelay: `${i * 60}ms`,
                opacity: zone.linked ? 1 : 0.6,
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'}
            >
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: cfg.bg,
                border: `1px solid ${zone.linked ? 'var(--border)' : 'var(--border-subtle)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: cfg.color, flexShrink: 0,
              }}>
                <StatusIcon size={16} strokeWidth={2} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {zone.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {zone.linked ? 'Connected device' : 'No device linked'}
                </div>
              </div>

              <div style={{ width: '80px', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Moisture</span>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: hasMoisture ? (m < 40 ? 'var(--amber)' : 'var(--text-secondary)') : 'var(--text-muted)' }}>
                    {hasMoisture ? `${m}%` : '—'}
                  </span>
                </div>
                <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                  {hasMoisture && (
                    <div style={{
                      height: '100%',
                      width: `${m}%`,
                      background: moistureColor,
                      borderRadius: '2px',
                      transition: 'width 0.6s ease',
                    }} />
                  )}
                </div>
              </div>

              <span style={{
                fontSize: '10px', fontWeight: 600,
                padding: '3px 8px', borderRadius: '20px',
                background: cfg.bg, color: cfg.color,
                flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.3px',
              }}>
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IrrigationZones;
