import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import { SensorData } from '../types';

interface SensorCardProps {
  title: string;
  icon: React.ReactNode;
  data: SensorData;
  color: string;
  delay?: number;
}

const statusLabels = { optimal: 'Optimal', warning: 'Low', critical: 'Critical' };
const statusBgTokens = {
  optimal: 'var(--accent-muted)',
  warning: 'var(--amber-muted)',
  critical: 'var(--red-muted)',
};
const statusColorTokens = {
  optimal: 'var(--accent-primary)',
  warning: 'var(--amber)',
  critical: 'var(--red)',
};

const SensorCard: React.FC<SensorCardProps> = ({ title, icon, data, color, delay = 0 }) => {
  const hasValue = data.current !== null;
  const hasHistory = data.history.length > 0;
  const TrendIcon = data.trend === 'up' ? TrendingUp : data.trend === 'down' ? TrendingDown : Minus;

  const statusBg = hasValue ? statusBgTokens[data.status] : 'var(--bg-elevated)';
  const statusColor = hasValue ? statusColorTokens[data.status] : 'var(--text-muted)';
  const trendColor = data.trend === 'up' ? 'var(--accent-primary)' : data.trend === 'down' ? 'var(--red)' : 'var(--text-muted)';

  return (
    <div
      className="fade-up"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        animationDelay: `${delay}ms`,
        transition: 'border-color 0.2s, background 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = color;
        (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: `${color}18`,
            border: `1px solid ${color}35`,
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color,
          }}>
            {icon}
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{title}</span>
        </div>
        <span style={{
          fontSize: '10px', fontWeight: 600,
          padding: '3px 8px', borderRadius: '20px',
          background: statusBg, color: statusColor,
          letterSpacing: '0.3px', textTransform: 'uppercase',
        }}>
          {hasValue ? statusLabels[data.status] : 'No data'}
        </span>
      </div>

      {/* Value */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '40px',
            fontWeight: 700,
            color: hasValue ? 'var(--text-primary)' : 'var(--text-muted)',
            lineHeight: 1,
            letterSpacing: '-1px',
          }}>
            {hasValue ? data.current : '—'}
          </span>
          {hasValue && (
            <span style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              {data.unit}
            </span>
          )}
          {hasValue && (
            <div style={{
              marginLeft: 'auto', marginBottom: '4px',
              display: 'flex', alignItems: 'center', gap: '4px',
              color: trendColor,
              fontSize: '12px',
            }}>
              <TrendIcon size={13} strokeWidth={2.5} />
            </div>
          )}
        </div>
      </div>

      {/* Sparkline or empty state */}
      <div style={{ height: '52px', marginLeft: '-4px', marginRight: '-4px' }}>
        {hasHistory ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.history} margin={{ top: 2, right: 4, left: 4, bottom: 2 }}>
              <defs>
                <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: 'var(--text-primary)',
                }}
                formatter={(val: number) => [`${val}${data.unit}`, title]}
                labelFormatter={() => ''}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={1.5}
                fill={`url(#grad-${title})`}
                dot={false}
                activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{
            height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', color: 'var(--text-muted)',
            border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-sm)',
          }}>
            Trend appears as readings arrive
          </div>
        )}
      </div>

      <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
        {hasHistory ? 'Live readings this session' : hasValue ? 'Live' : 'Waiting for device'}
      </div>
    </div>
  );
};

export default SensorCard;
