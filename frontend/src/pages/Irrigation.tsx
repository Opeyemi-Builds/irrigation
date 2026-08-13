import React, { useState } from 'react';
import { Play, Pause, Square, Droplets, Clock, Calendar, ChevronRight, ToggleLeft, ToggleRight, Zap, AlertTriangle } from 'lucide-react';
import { mockDashboardData } from '../data/mockData';
import { IrrigationZone } from '../types';

const statusConfig = {
  active: { color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)', label: 'Active' },
  idle: { color: 'var(--text-muted)', bg: 'transparent', border: 'var(--border)', label: 'Idle' },
  scheduled: { color: '#5bbfef', bg: 'rgba(91,191,239,0.08)', border: 'rgba(91,191,239,0.2)', label: 'Scheduled' },
  paused: { color: '#f5a623', bg: 'rgba(245,166,35,0.08)', border: 'rgba(245,166,35,0.2)', label: 'Paused' },
};

const ZoneCard: React.FC<{ zone: IrrigationZone; onAction: (id: string, action: string) => void }> = ({ zone, onAction }) => {
  const cfg = statusConfig[zone.status];

  return (
    <div style={{
      background: 'var(--bg-card)', border: `1px solid ${cfg.border}`,
      borderRadius: 'var(--radius-lg)', padding: '20px',
      transition: 'border-color 0.2s',
    }}>
      {/* Zone header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>{zone.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{zone.area} hectares</div>
        </div>
        <span style={{
          fontSize: '10px', fontWeight: 700,
          padding: '3px 10px', borderRadius: '20px',
          background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
          textTransform: 'uppercase', letterSpacing: '0.4px',
        }}>{cfg.label}</span>
      </div>

      {/* Moisture */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Soil Moisture</span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: zone.moisture < 40 ? '#fbbf24' : zone.moisture > 70 ? '#5bbfef' : '#4ade80' }}>
            {zone.moisture}%
          </span>
        </div>
        <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${zone.moisture}%`,
            background: zone.moisture < 40 ? 'linear-gradient(90deg, #fbbf24, #f59e0b)' : zone.moisture > 70 ? 'linear-gradient(90deg, #5bbfef, #3b9fd4)' : 'linear-gradient(90deg, #4ade80, #22c55e)',
            borderRadius: '3px', transition: 'width 0.6s ease',
          }} />
        </div>
      </div>

      {/* Schedule info */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <div style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Last irrigated</div>
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>{zone.lastIrrigated}</div>
        </div>
        <div style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Next cycle</div>
          <div style={{ fontSize: '12px', fontWeight: 500, color: cfg.color }}>{zone.nextScheduled}</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {zone.status !== 'active' && (
          <button onClick={() => onAction(zone.id, 'start')} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            background: 'rgba(74,222,128,0.1)', color: '#4ade80',
            border: '1px solid rgba(74,222,128,0.2)',
            borderRadius: 'var(--radius-sm)', padding: '7px', fontSize: '12px', fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(74,222,128,0.2)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(74,222,128,0.1)'}
          >
            <Play size={12} /> Start
          </button>
        )}
        {zone.status === 'active' && (
          <button onClick={() => onAction(zone.id, 'stop')} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            background: 'rgba(248,113,113,0.1)', color: '#f87171',
            border: '1px solid rgba(248,113,113,0.2)',
            borderRadius: 'var(--radius-sm)', padding: '7px', fontSize: '12px', fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
            <Square size={12} /> Stop
          </button>
        )}
        <button onClick={() => onAction(zone.id, zone.status === 'paused' ? 'resume' : 'pause')} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          background: 'var(--bg-surface)', color: 'var(--text-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '7px', fontSize: '12px',
          cursor: 'pointer', transition: 'all 0.15s',
        }}>
          <Pause size={12} /> {zone.status === 'paused' ? 'Resume' : 'Pause'}
        </button>
        <button style={{
          width: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-surface)', color: 'var(--text-secondary)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
        }}>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};

const Irrigation: React.FC = () => {
  const [zones, setZones] = useState<IrrigationZone[]>(mockDashboardData.zones);
  const [autoMode, setAutoMode] = useState(true);
  const [rainPause, setRainPause] = useState(true);

  const handleAction = (id: string, action: string) => {
    setZones(prev => prev.map(z => {
      if (z.id !== id) return z;
      if (action === 'start') return { ...z, status: 'active' };
      if (action === 'stop') return { ...z, status: 'idle' };
      if (action === 'pause') return { ...z, status: 'paused' };
      if (action === 'resume') return { ...z, status: 'scheduled' };
      return z;
    }));
  };

  const activeZones = zones.filter(z => z.status === 'active').length;
  const totalWater = zones.filter(z => z.status === 'active').reduce((a, z) => a + z.area * 12, 0);

  return (
    <div style={{ padding: '28px 32px', overflowY: 'auto', height: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: '4px' }}>
            Irrigation Control
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Manage zones, schedules, and automation rules
          </p>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          background: 'var(--accent-muted)', color: 'var(--accent-primary)',
          border: '1px solid rgba(93,234,138,0.2)',
          borderRadius: 'var(--radius-sm)', padding: '8px 16px',
          fontSize: '12px', fontWeight: 600, cursor: 'pointer',
        }}>
          <Zap size={13} /> Run All Zones
        </button>
      </div>

      {/* System stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Active Zones', value: `${activeZones} / ${zones.length}`, color: activeZones > 0 ? '#4ade80' : 'var(--text-secondary)' },
          { label: 'Flow Rate', value: activeZones > 0 ? `${totalWater.toFixed(0)} L/hr` : '0 L/hr', color: '#5bbfef' },
          { label: 'Water Saved', value: '1,240 L', color: 'var(--accent-primary)' },
          { label: 'Next Cycle', value: 'In 2h', color: '#f5a623' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '16px',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Automation toggles */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '18px 20px',
        marginBottom: '20px',
        display: 'flex', gap: '24px', alignItems: 'center',
      }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginRight: '8px' }}>Automation</div>
        
        {[
          { label: 'Smart Auto Mode', sub: 'Irrigate based on soil moisture thresholds', state: autoMode, set: setAutoMode },
          { label: 'Rain Pause', sub: 'Hold irrigation if rain is forecast within 3h', state: rainPause, set: setRainPause },
        ].map(t => (
          <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{t.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.sub}</div>
            </div>
            <button onClick={() => t.set(!t.state)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.state ? 'var(--accent-primary)' : 'var(--text-muted)', transition: 'color 0.15s' }}>
              {t.state ? <ToggleRight size={28} strokeWidth={1.5} /> : <ToggleLeft size={28} strokeWidth={1.5} />}
            </button>
          </div>
        ))}

        {rainPause && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)',
            borderRadius: 'var(--radius-sm)', padding: '8px 12px',
          }}>
            <AlertTriangle size={13} color="#f5a623" />
            <span style={{ fontSize: '11px', color: '#f5a623', whiteSpace: 'nowrap' }}>Rain at 9h · Zone 2 paused</span>
          </div>
        )}
      </div>

      {/* Zone grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {zones.map(zone => (
          <ZoneCard key={zone.id} zone={zone} onAction={handleAction} />
        ))}
      </div>
    </div>
  );
};

export default Irrigation;
