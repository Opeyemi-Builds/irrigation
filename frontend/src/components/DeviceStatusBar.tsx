import React from 'react';
import { Wifi, WifiOff, Radio, AlertTriangle } from 'lucide-react';

interface Props {
  deviceConnected: boolean;
  usingMockData: boolean;
  statusMessage: string;
  lastUpdated: string;
  pumpStatus: boolean;
  isCharging: boolean;
}

const DeviceStatusBar: React.FC<Props> = ({
  deviceConnected,
  usingMockData,
  statusMessage,
  lastUpdated,
  pumpStatus,
  isCharging,
}) => {
  const isLive = deviceConnected && !usingMockData;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      background: isLive
        ? 'rgba(93,234,138,0.06)'
        : usingMockData
          ? 'rgba(245,166,35,0.06)'
          : 'rgba(248,113,113,0.06)',
      border: `1px solid ${isLive
        ? 'rgba(93,234,138,0.15)'
        : usingMockData
          ? 'rgba(245,166,35,0.15)'
          : 'rgba(248,113,113,0.15)'}`,
      borderRadius: 'var(--radius-md)',
      padding: '8px 16px',
      marginBottom: '20px',
    }}>
      {/* Connection icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {isLive ? (
          <Radio size={13} color="var(--accent-primary)" />
        ) : usingMockData ? (
          <AlertTriangle size={13} color="var(--amber)" />
        ) : (
          <WifiOff size={13} color="#f87171" />
        )}
        <span style={{
          fontSize: '11px', fontWeight: 700,
          color: isLive ? 'var(--accent-primary)' : usingMockData ? 'var(--amber)' : '#f87171',
          textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          {isLive ? 'Live' : usingMockData ? 'Demo Mode' : 'Offline'}
        </span>
      </div>

      <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />

      {/* Status message */}
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 1 }}>
        {isLive ? `Device streaming · last ping ${new Date(lastUpdated).toLocaleTimeString()}` : statusMessage}
      </span>

      {/* Device stats — only show when live */}
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
            <span style={{ fontSize: '11px', color: isCharging ? '#fbbf24' : 'var(--text-muted)' }}>
              {isCharging ? '⚡ Charging' : '🔋 Battery'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceStatusBar;
