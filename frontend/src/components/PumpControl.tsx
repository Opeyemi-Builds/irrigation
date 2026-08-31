import React from 'react';
import { Power, PowerOff, Gauge, Link2Off } from 'lucide-react';
import { RELAY_ON_THRESHOLD, RELAY_OFF_THRESHOLD } from '../data/config';
import { PumpMode } from '../types';

// The three pump modes, in the order they appear in the segmented control.
const PUMP_MODES: { key: PumpMode; label: string; icon: React.ReactNode; color: string; muted: string }[] = [
  { key: 'auto', label: 'Auto',     icon: <Gauge size={15} />,    color: 'var(--blue)',           muted: 'var(--blue-muted)' },
  { key: 'on',   label: 'Pump On',  icon: <Power size={15} />,    color: 'var(--accent-primary)', muted: 'var(--accent-muted)' },
  { key: 'off',  label: 'Pump Off', icon: <PowerOff size={15} />, color: 'var(--amber)',          muted: 'var(--amber-muted)' },
];

// Shared pump control card — the AUTO / ON / OFF override plus a plain-language
// note on what the current mode does. Rendered on both the Irrigation page and the
// Dashboard so the control is always in reach.
//
// `linked` reflects whether this farm's Product ID is attached to the physical
// device. When it isn't, there's no hardware to command: the buttons are disabled
// and the card explains why, rather than sending commands that would be rejected.
const PumpControl: React.FC<{
  mode: PumpMode;
  pumpOn: boolean | null;
  connected: boolean;
  linked?: boolean;
  onChange: (m: PumpMode) => void;
}> = ({ mode, pumpOn, connected, linked = true, onChange }) => {
  const note = !linked
    ? 'This farm has no device attached, so there is no pump to control here. Live control is available on the farms linked to the hardware.'
    : mode === 'auto'
      ? `Automatic — the device waters when soil dries to ${RELAY_ON_THRESHOLD}% and stops once it recovers to ${RELAY_OFF_THRESHOLD}%.`
      : mode === 'on'
        ? 'Manual override — pump forced ON, ignoring soil moisture. Switch to Auto to hand control back to the device.'
        : 'Manual override — pump forced OFF, ignoring soil moisture. Switch to Auto to resume automatic watering.';

  const reach = !linked
    ? null
    : connected
      ? 'Commands reach the device within about 5 seconds.'
      : 'Device offline — this will apply as soon as it reconnects.';

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Power size={15} color="var(--accent-primary)" />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Pump Control</h3>
        </div>
        {!linked ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
            <Link2Off size={12} /> No device linked
          </span>
        ) : (
          <span style={{ fontSize: '11px', fontWeight: 600, color: pumpOn ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
            {pumpOn == null ? 'Pump —' : pumpOn ? 'Pump running' : 'Pump off'}
          </span>
        )}
      </div>

      {/* Segmented AUTO / ON / OFF control */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
        {PUMP_MODES.map(pm => {
          const active = linked && mode === pm.key;
          return (
            <button
              key={pm.key}
              onClick={() => { if (linked) onChange(pm.key); }}
              disabled={!linked}
              aria-pressed={active}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                padding: '13px 8px', borderRadius: 'var(--radius-md)',
                cursor: linked ? 'pointer' : 'not-allowed',
                background: active ? pm.muted : 'transparent',
                border: `1px solid ${active ? pm.color : 'var(--border-subtle)'}`,
                color: active ? pm.color : 'var(--text-muted)',
                fontWeight: active ? 700 : 500, fontSize: '12.5px',
                opacity: linked ? 1 : 0.5,
                transition: 'all 0.15s ease',
              }}
            >
              {pm.icon}
              {pm.label}
            </button>
          );
        })}
      </div>

      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: reach ? '4px' : 0 }}>{note}</p>
      {reach && <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{reach}</p>}
    </div>
  );
};

export default PumpControl;
