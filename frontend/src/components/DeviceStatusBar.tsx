import React from 'react';
import { Radio, WifiOff, Zap, Battery } from 'lucide-react';

interface Props {
  deviceConnected: boolean;
  hasData: boolean;
  lastUpdated: string | null;
  pumpStatus: boolean | null;
  isCharging: boolean | null;
}

// Calm two-state indicator: the device is either streaming live, or we're
// waiting for it. No "demo", no "offline" alarm — just an honest status.
const DeviceStatusBar: React.FC<Props> = ({
  deviceConnected,
  hasData,
  lastUpdated,
  pumpStatus,
  isCharging,
}) => {
  const isLive = deviceConnected && hasData;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      background: isLive ? 'var(--accent-muted)' : 'var(--bg-card)',
      border: `1px solid ${isLive ? 'var(--accent-glow)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-md)',
      padding: '8px 16px',
      marginBottom: '20px',
    }}>
      {/* Connection status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {isLive ? <Radio size={13} color="var(--accent-primary)" /> : <WifiOff size={13} color="var(--text-muted)" />}
        <span style={{
          fontSize: '11px', fontWeight: 700,
          color: isLive ? 'var(--accent-primary)' : 'var(--text-secondary)',
          textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          {isLive ? 'Live' : 'Waiting for device'}
        </span>
      </div>

      <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />

      {/* Message */}
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 1 }}>
        {isLive && lastUpdated
          ? `Device streaming · last update ${new Date(lastUpdated).toLocaleTimeString()}`
          : 'Readings will appear here automatically once your device connects.'}
      </span>

      {/* Device stats — only when live */}
      {isLive && (
        <div style={{ display: 'flex', gap: '14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: pumpStatus ? 'var(--accent-primary)' : 'var(--text-muted)',
              boxShadow: pumpStatus ? '0 0 6px var(--accent-glow)' : 'none',
              animation: pumpStatus ? 'pulse-dot 1.5s ease infinite' : 'none',
            }} />
            <span style={{ fontSize: '11px', color: pumpStatus ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
              Pump {pumpStatus ? 'ON' : 'OFF'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            {isCharging
              ? <Zap size={12} color="var(--amber)" />
              : <Battery size={12} color="var(--text-muted)" />}
            <span style={{ fontSize: '11px', color: isCharging ? 'var(--amber)' : 'var(--text-muted)' }}>
              {isCharging ? 'Charging' : 'On battery'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceStatusBar;
