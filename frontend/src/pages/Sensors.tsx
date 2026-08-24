import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Thermometer, Droplets, Leaf, TrendingUp, TrendingDown, Minus, Activity, LineChart as LineChartIcon } from 'lucide-react';
import { useLiveData } from '../hooks/useLiveData';
import EmptyState from '../components/EmptyState';
import { format } from 'date-fns';

type SensorKey = 'temperature' | 'humidity' | 'soilMoisture';

const SENSORS: { key: SensorKey; label: string; unit: string; color: string; icon: React.ReactNode; min: number; max: number; optimalMin: number; optimalMax: number }[] = [
  { key: 'temperature',  label: 'Temperature',  unit: '°C', color: '#ff7c5e', icon: <Thermometer size={16} />, min: 0, max: 50,  optimalMin: 20, optimalMax: 35 },
  { key: 'humidity',     label: 'Humidity',     unit: '%',  color: '#5bbfef', icon: <Droplets size={16} />,    min: 0, max: 100, optimalMin: 50, optimalMax: 80 },
  { key: 'soilMoisture', label: 'Soil Moisture', unit: '%', color: '#5dea8a', icon: <Leaf size={16} />,        min: 0, max: 100, optimalMin: 40, optimalMax: 70 },
];

const StatBox: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px', flex: 1 }}>
    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: color || 'var(--text-primary)', letterSpacing: '-0.5px' }}>{value}</div>
  </div>
);

const Sensors: React.FC = () => {
  const live = useLiveData();
  const [active, setActive] = useState<SensorKey>('temperature');
  const sensor = SENSORS.find(s => s.key === active)!;

  const current = live[active]; // number | null
  const history = live.history
    .filter(p => p[active] != null)
    .map(p => ({ timestamp: p.timestamp, value: p[active] as number }));

  const values = history.map(h => h.value);
  const hasStats = values.length > 0;
  const avg = hasStats ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '—';
  const min = hasStats ? Math.min(...values).toFixed(1) : '—';
  const max = hasStats ? Math.max(...values).toFixed(1) : '—';

  // Trend from the session buffer.
  const last = values[values.length - 1];
  const prev = values[values.length - 4] ?? values[0];
  const trend: 'up' | 'down' | 'stable' =
    !hasStats || last == null || prev == null ? 'stable'
      : last > prev + 0.5 ? 'up' : last < prev - 0.5 ? 'down' : 'stable';

  // Status from the crop-agnostic optimal band.
  let status: 'optimal' | 'warning' | 'critical' = 'optimal';
  if (current != null) {
    const criticalLow = sensor.optimalMin * 0.7;
    const criticalHigh = sensor.optimalMax * 1.2;
    if (current < criticalLow || current > criticalHigh) status = 'critical';
    else if (current < sensor.optimalMin || current > sensor.optimalMax) status = 'warning';
  }

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'var(--accent-primary)' : trend === 'down' ? 'var(--red)' : 'var(--text-muted)';
  const statusColor = { optimal: 'var(--accent-primary)', warning: 'var(--amber)', critical: 'var(--red)' }[status];

  const chartData = history.map(h => ({ time: format(new Date(h.timestamp), 'HH:mm:ss'), value: h.value }));
  const hasChart = chartData.length >= 2;

  return (
    <div style={{ padding: '28px 32px', overflowY: 'auto', height: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: '4px' }}>
          Sensors
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Detailed readings from your field sensors
        </p>
      </div>

      {/* Sensor selector tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {SENSORS.map(s => (
          <button
            key={s.key}
            onClick={() => setActive(s.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px', borderRadius: 'var(--radius-md)',
              border: `1px solid ${active === s.key ? s.color + '60' : 'var(--border)'}`,
              background: active === s.key ? s.color + '12' : 'var(--bg-card)',
              color: active === s.key ? s.color : 'var(--text-secondary)',
              fontSize: '13px', fontWeight: active === s.key ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {/* Current reading hero */}
      <div style={{
        background: 'var(--bg-card)', border: `1px solid ${sensor.color}30`,
        borderRadius: 'var(--radius-xl)', padding: '28px 32px', marginBottom: '16px',
        display: 'flex', alignItems: 'center', gap: '40px', flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Current Reading
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '64px', fontWeight: 800, color: current != null ? sensor.color : 'var(--text-muted)', lineHeight: 1, letterSpacing: '-2px' }}>
              {current != null ? current : '—'}
            </span>
            {current != null && <span style={{ fontSize: '24px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{sensor.unit}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
            {current != null ? (
              <>
                <span style={{ background: statusColor + '18', color: statusColor, border: `1px solid ${statusColor}30`, borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  {status}
                </span>
                {hasStats && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: trendColor }}>
                    <TrendIcon size={13} strokeWidth={2.5} />
                    {trend === 'stable' ? 'Stable' : trend === 'up' ? 'Rising' : 'Falling'}
                  </span>
                )}
              </>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Waiting for device</span>
            )}
          </div>
        </div>

        {/* Optimal range gauge */}
        <div style={{ flex: 1, minWidth: '260px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Range · {sensor.min}{sensor.unit} — {sensor.max}{sensor.unit}
          </div>
          <div style={{ position: 'relative', height: '12px', background: 'var(--bg-elevated)', borderRadius: '6px', overflow: 'visible' }}>
            <div style={{
              position: 'absolute',
              left: `${(sensor.optimalMin / sensor.max) * 100}%`,
              width: `${((sensor.optimalMax - sensor.optimalMin) / sensor.max) * 100}%`,
              height: '100%', background: sensor.color + '25', border: `1px solid ${sensor.color}40`, borderRadius: '4px',
            }} />
            {current != null && (
              <div style={{
                position: 'absolute',
                left: `calc(${(Math.min(current, sensor.max) / sensor.max) * 100}% - 6px)`,
                top: '-3px', width: '18px', height: '18px', borderRadius: '50%',
                background: sensor.color, boxShadow: `0 0 10px ${sensor.color}80`, border: '2px solid var(--bg-card)',
              }} />
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
            <span>{sensor.min}{sensor.unit}</span>
            <span style={{ color: sensor.color + 'cc' }}>Optimal: {sensor.optimalMin}–{sensor.optimalMax}{sensor.unit}</span>
            <span>{sensor.max}{sensor.unit}</span>
          </div>
        </div>

        {/* Stat boxes */}
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
          <StatBox label="Session Min" value={hasStats ? `${min}${sensor.unit}` : '—'} />
          <StatBox label="Session Max" value={hasStats ? `${max}${sensor.unit}` : '—'} />
          <StatBox label="Average" value={hasStats ? `${avg}${sensor.unit}` : '—'} color={sensor.color} />
        </div>
      </div>

      {/* Trend chart */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            Live Trend
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>This session</span>
        </div>
        {hasChart ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="sensorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={sensor.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={sensor.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(chartData.length / 6))} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-primary)' }}
                formatter={(v: number) => [`${v}${sensor.unit}`, sensor.label]}
              />
              <ReferenceLine y={sensor.optimalMin} stroke={sensor.color + '40'} strokeDasharray="4 4" />
              <ReferenceLine y={sensor.optimalMax} stroke={sensor.color + '40'} strokeDasharray="4 4" />
              <Area type="monotone" dataKey="value" stroke={sensor.color} strokeWidth={2} fill="url(#sensorGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: sensor.color }} connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState
            icon={<LineChartIcon size={22} />}
            title="No readings yet"
            message={`The ${sensor.label.toLowerCase()} trend will build here as your device sends readings.`}
          />
        )}
      </div>

      {/* Threshold reference */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '18px 20px',
        display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={14} color="var(--text-muted)" />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Reference thresholds</span>
        </div>
        {[
          { label: 'Optimal from', value: `${sensor.optimalMin}${sensor.unit}`, color: 'var(--accent-primary)' },
          { label: 'Optimal to', value: `${sensor.optimalMax}${sensor.unit}`, color: 'var(--accent-primary)' },
          { label: 'Warning below', value: `${sensor.optimalMin}${sensor.unit}`, color: 'var(--amber)' },
          { label: 'Critical below', value: `${Math.round(sensor.optimalMin * 0.7)}${sensor.unit}`, color: 'var(--red)' },
        ].map(t => (
          <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.color }} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.label}:</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: t.color }}>{t.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sensors;
