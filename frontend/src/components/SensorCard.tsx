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

const SensorCard: React.FC<SensorCardProps> = ({ title, icon, data, color, delay = 0 }) => {
  const TrendIcon = data.trend === 'up' ? TrendingUp : data.trend === 'down' ? TrendingDown : Minus;

  const statusBg = {
    optimal: 'rgba(74, 222, 128, 0.1)',
    warning: 'rgba(251, 191, 36, 0.1)',
    critical: 'rgba(248, 113, 113, 0.1)',
  }[data.status];

  const statusColor = {
    optimal: '#4ade80',
    warning: '#fbbf24',
    critical: '#f87171',
  }[data.status];

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
          {statusLabels[data.status]}
        </span>
      </div>

      {/* Value */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '40px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1,
            letterSpacing: '-1px',
          }}>
            {data.current}
          </span>
          <span style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {data.unit}
          </span>
          <div style={{
            marginLeft: 'auto', marginBottom: '4px',
            display: 'flex', alignItems: 'center', gap: '4px',
            color: data.trend === 'up' ? '#4ade80' : data.trend === 'down' ? '#f87171' : 'var(--text-muted)',
            fontSize: '12px',
          }}>
            <TrendIcon size={13} strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* Sparkline */}
      <div style={{ height: '52px', marginLeft: '-4px', marginRight: '-4px' }}>
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
      </div>

      <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
        Last 24 hours
      </div>
    </div>
  );
};

export default SensorCard;
