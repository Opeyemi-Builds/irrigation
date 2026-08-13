import React from 'react';
import { Pause, Clock, CheckCircle } from 'lucide-react';
import { IrrigationZone } from '../types';

interface Props {
  zones: IrrigationZone[];
}

// Minus must be defined BEFORE statusConfig
const Minus = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const statusConfig = {
  active:    { label: 'Active',    color: '#4ade80',           bg: 'rgba(74,222,128,0.08)',  Icon: CheckCircle },
  idle:      { label: 'Idle',      color: 'var(--text-muted)', bg: 'transparent',            Icon: Minus },
  scheduled: { label: 'Scheduled', color: 'var(--blue)',       bg: 'var(--blue-muted)',      Icon: Clock },
  paused:    { label: 'Paused',    color: 'var(--amber)',      bg: 'var(--amber-muted)',     Icon: Pause },
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
        <button style={{
          background: 'var(--accent-muted)',
          color: 'var(--accent-primary)',
          border: '1px solid rgba(93,234,138,0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '5px 12px',
          fontSize: '11px', fontWeight: 600,
          cursor: 'pointer',
        }}>
          Manage
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {zones.map((zone, i) => {
          const cfg = statusConfig[zone.status];
          const StatusIcon = cfg.Icon;
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
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'}
            >
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: cfg.bg,
                border: `1px solid ${cfg.color}30`,
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
                  {zone.area} ha · Next: <span style={{ color: cfg.color }}>{zone.nextScheduled}</span>
                </div>
              </div>

              <div style={{ width: '80px', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Moisture</span>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: zone.moisture < 40 ? 'var(--amber)' : 'var(--text-secondary)' }}>
                    {zone.moisture}%
                  </span>
                </div>
                <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${zone.moisture}%`,
                    background: zone.moisture < 40 ? 'var(--amber)' : zone.moisture > 70 ? 'var(--blue)' : 'var(--accent-primary)',
                    borderRadius: '2px',
                    transition: 'width 0.6s ease',
                  }} />
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