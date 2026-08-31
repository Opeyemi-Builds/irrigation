import React, { useMemo, useState } from 'react';
import { Power, Droplets, Waves, Gauge, Info, CheckCircle, Minus as MinusIcon } from 'lucide-react';
import { useLiveData } from '../hooks/useLiveData';
import { getFarmProfile, buildZones, getCropInfo } from '../lib/farm';
import { useIsMobile } from '../hooks/useIsMobile';
import { RELAY_ON_THRESHOLD, RELAY_OFF_THRESHOLD } from '../data/config';
import { IrrigationZone, PumpMode } from '../types';
import PumpControl from '../components/PumpControl';
import FarmSettings from '../components/FarmSettings';

const statusConfig: Record<IrrigationZone['status'], { color: string; bg: string; label: string }> = {
  active:    { color: 'var(--accent-primary)', bg: 'var(--accent-muted)', label: 'Watering' },
  idle:      { color: 'var(--text-muted)',     bg: 'transparent',         label: 'Idle' },
  scheduled: { color: 'var(--blue)',           bg: 'var(--blue-muted)',   label: 'Scheduled' },
  paused:    { color: 'var(--amber)',          bg: 'var(--amber-muted)',  label: 'Paused' },
};

const ZoneCard: React.FC<{ zone: IrrigationZone; pumpMode: PumpMode }> = ({ zone, pumpMode }) => {
  const cfg = statusConfig[zone.status];
  const hasMoisture = zone.moisture != null;
  const m = zone.moisture ?? 0;
  const moistureColor = m < RELAY_ON_THRESHOLD ? 'var(--amber)' : m > RELAY_OFF_THRESHOLD ? 'var(--blue)' : 'var(--accent-primary)';

  // What to say about how this zone is being controlled right now.
  const controlLabel = !zone.linked
    ? 'Link a device to activate this zone'
    : pumpMode === 'on'
      ? 'Manual override · pump forced ON'
      : pumpMode === 'off'
        ? 'Manual override · pump forced OFF'
        : `Automatic · waters below ${RELAY_ON_THRESHOLD}%, stops at ${RELAY_OFF_THRESHOLD}%`;
  const manual = zone.linked && pumpMode !== 'auto';

  return (
    <div style={{
      background: 'var(--bg-card)', border: `1px solid ${zone.linked ? 'var(--border)' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-lg)', padding: '20px', opacity: zone.linked ? 1 : 0.65,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{zone.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{zone.linked ? 'Connected device' : 'No device linked'}</div>
        </div>
        <span style={{
          fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
          background: cfg.bg, color: cfg.color, border: `1px solid ${zone.linked ? 'var(--border)' : 'var(--border-subtle)'}`,
          textTransform: 'uppercase', letterSpacing: '0.4px', flexShrink: 0,
        }}>{cfg.label}</span>
      </div>

      {/* Moisture */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Soil Moisture</span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: hasMoisture ? moistureColor : 'var(--text-muted)' }}>
            {hasMoisture ? `${m}%` : '—'}
          </span>
        </div>
        <div style={{ position: 'relative', height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
          {hasMoisture && (
            <div style={{ height: '100%', width: `${m}%`, background: moistureColor, borderRadius: '3px', transition: 'width 0.6s ease' }} />
          )}
        </div>
      </div>

      {/* Control mode */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', padding: '9px 12px' }}>
        {!zone.linked
          ? <MinusIcon size={13} color="var(--text-muted)" />
          : manual
            ? <Power size={13} color="var(--amber)" />
            : <CheckCircle size={13} color="var(--accent-primary)" />}
        <span style={{ fontSize: '11px', color: manual ? 'var(--amber)' : 'var(--text-secondary)' }}>
          {controlLabel}
        </span>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; color: string; icon: React.ReactNode }> = ({ label, value, color, icon }) => (
  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
      <span style={{ color }}>{icon}</span>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
    </div>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color }}>{value}</div>
  </div>
);

const Irrigation: React.FC = () => {
  const live = useLiveData();
  const isMobile = useIsMobile();
  // Re-read the saved profile whenever Farm settings edits it, so the zone titles
  // and crop guidance below reflect a rename or crop change without a page reload.
  const [profileVersion, setProfileVersion] = useState(0);
  const profile = useMemo(() => getFarmProfile(), [profileVersion]);
  const crop = getCropInfo(profile?.crop);
  const zones = buildZones({ soilMoisture: live.soilMoisture, pumpStatus: live.pumpStatus, hasData: live.hasData }, profile);

  const soil = live.soilMoisture;
  const pumpOn = live.pumpStatus;
  const mode: PumpMode = live.pumpCommand ?? 'auto';
  const modeLabel = mode === 'auto' ? 'Automatic' : mode === 'on' ? 'Manual · On' : 'Manual · Off';

  // Plain-language read of what the automatic controller is doing.
  let controlNote = 'Waiting for a soil-moisture reading to begin automatic control.';
  if (soil != null) {
    if (soil <= RELAY_ON_THRESHOLD) controlNote = `Soil is at ${soil}% — at or below the ${RELAY_ON_THRESHOLD}% start point, so the pump runs until the soil recovers to ${RELAY_OFF_THRESHOLD}%.`;
    else if (soil >= RELAY_OFF_THRESHOLD) controlNote = `Soil is at ${soil}% — at or above the ${RELAY_OFF_THRESHOLD}% target, so the pump stays off until it dries back to ${RELAY_ON_THRESHOLD}%.`;
    else controlNote = `Soil is at ${soil}%, between the ${RELAY_ON_THRESHOLD}% start and ${RELAY_OFF_THRESHOLD}% stop points — the controller holds its current state.`;
  }

  return (
    <div style={{ padding: isMobile ? '18px 16px 32px' : '28px 32px', overflowY: 'auto', height: isMobile ? 'auto' : '100vh', minHeight: isMobile ? '100%' : undefined }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: '4px' }}>
          Irrigation Control
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Your pump runs automatically from live soil-moisture readings — or take manual control below
        </p>
      </div>

      {/* Live stats */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <StatCard label="Pump" value={pumpOn == null ? '—' : pumpOn ? 'Running' : 'Off'} color={pumpOn ? 'var(--accent-primary)' : 'var(--text-secondary)'} icon={<Power size={14} />} />
        <StatCard label="Soil Moisture" value={soil != null ? `${soil}%` : '—'} color="var(--accent-primary)" icon={<Droplets size={14} />} />
        <StatCard label="Reservoir" value={live.reservoirPct != null ? `${live.reservoirPct}%` : '—'} color="var(--blue)" icon={<Waves size={14} />} />
        <StatCard label="Control Mode" value={modeLabel} color={mode === 'auto' ? 'var(--text-primary)' : 'var(--amber)'} icon={<Gauge size={14} />} />
      </div>

      {/* Pump control */}
      <PumpControl mode={mode} pumpOn={pumpOn} connected={live.deviceConnected} linked={live.deviceLinked} onChange={live.setPumpMode} />

      {/* How automatic control works */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
        padding: '20px', marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Info size={15} color="var(--accent-primary)" />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>How your system waters</h3>
        </div>

        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
          {controlNote}{crop ? ` For ${crop.label.toLowerCase()}, a healthy root zone sits around ${crop.moistureMin}–${crop.moistureMax}%.` : ''}
        </p>

        {/* Threshold bar */}
        <div style={{ position: 'relative', height: '10px', background: 'var(--bg-elevated)', borderRadius: '5px', marginBottom: '8px' }}>
          <div style={{ position: 'absolute', left: 0, width: `${RELAY_ON_THRESHOLD}%`, height: '100%', background: 'var(--amber-muted)', borderRadius: '5px 0 0 5px' }} />
          <div style={{ position: 'absolute', left: `${RELAY_OFF_THRESHOLD}%`, right: 0, height: '100%', background: 'var(--blue-muted)', borderRadius: '0 5px 5px 0' }} />
          {soil != null && (
            <div style={{ position: 'absolute', left: `calc(${Math.min(soil, 100)}% - 7px)`, top: '-4px', width: '14px', height: '14px', borderRadius: '50%', background: 'var(--accent-primary)', border: '2px solid var(--bg-card)', boxShadow: '0 0 8px var(--accent-glow)' }} />
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
          <span>0%</span>
          <span style={{ color: 'var(--amber)' }}>Pump ON ≤ {RELAY_ON_THRESHOLD}%</span>
          <span style={{ color: 'var(--blue)' }}>Pump OFF ≥ {RELAY_OFF_THRESHOLD}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Zones */}
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Zones</h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
        {zones.map(zone => <ZoneCard key={zone.id} zone={zone} pumpMode={mode} />)}
      </div>

      {/* Farm settings — rename the farm and edit its crops */}
      <div style={{ marginTop: '28px' }}>
        <FarmSettings onChange={() => setProfileVersion(v => v + 1)} />
      </div>
    </div>
  );
};

export default Irrigation;
