import React, { useState } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Thermometer, Droplets, Leaf, TrendingUp, TrendingDown, Minus, Activity, AlertTriangle } from 'lucide-react';
import { mockDashboardData } from '../data/mockData';
import { format } from 'date-fns';

type SensorKey = 'temperature' | 'humidity' | 'soilMoisture';

const sensors: { key: SensorKey; label: string; unit: string; color: string; icon: React.ReactNode; min: number; max: number; optimalMin: number; optimalMax: number }[] = [
  { key: 'temperature', label: 'Temperature', unit: '°C', color: '#ff7c5e', icon: <Thermometer size={16} />, min: 0, max: 50, optimalMin: 20, optimalMax: 35 },
  { key: 'humidity', label: 'Humidity', unit: '%', color: '#5bbfef', icon: <Droplets size={16} />, min: 0, max: 100, optimalMin: 50, optimalMax: 80 },
  { key: 'soilMoisture', label: 'Soil Moisture', unit: '%', color: '#5dea8a', icon: <Leaf size={16} />, min: 0, max: 100, optimalMin: 40, optimalMax: 70 },
];

const StatBox: React.FC<{ label: string; value: string; sub?: string; color?: string }> = ({ label, value, sub, color }) => (
  <div style={{
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', padding: '16px',
    flex: 1,
  }}>
    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: color || 'var(--text-primary)', letterSpacing: '-0.5px' }}>{value}</div>
    {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</div>}
  </div>
);

const Sensors: React.FC = () => {
  const [active, setActive] = useState<SensorKey>('temperature');
  const data = mockDashboardData;
  const sensor = sensors.find(s => s.key === active)!;
  const sensorData = data[active];

  const history = sensorData.history;
  const values = history.map(h => h.value);
  const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  const min = Math.min(...values).toFixed(1);
  const max = Math.max(...values).toFixed(1);
  const latest = sensorData.current;

  const chartData = history.map(h => ({
    time: format(new Date(h.timestamp), 'HH:mm'),
    value: h.value,
  }));

  // Hourly bar data (group into 6 buckets of 4)
  const barData = Array.from({ length: 6 }, (_, i) => {
    const slice = history.slice(i * 4, i * 4 + 4);
    const avg = slice.reduce((a, b) => a + b.value, 0) / slice.length;
    return {
      label: format(new Date(slice[0]?.timestamp || Date.now()), 'HH:mm'),
      avg: parseFloat(avg.toFixed(1)),
    };
  });

  const TrendIcon = sensorData.trend === 'up' ? TrendingUp : sensorData.trend === 'down' ? TrendingDown : Minus;
  const trendColor = sensorData.trend === 'up' ? '#4ade80' : sensorData.trend === 'down' ? '#f87171' : 'var(--text-muted)';

  const statusColor = { optimal: '#4ade80', warning: '#fbbf24', critical: '#f87171' }[sensorData.status];

  return (
    <div style={{ padding: '28px 32px', overflowY: 'auto', height: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: '4px' }}>
          Sensors
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Detailed readings from all field sensors · 24-hour history
        </p>
      </div>

      {/* Sensor selector tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {sensors.map(s => (
          <button
            key={s.key}
            onClick={() => setActive(s.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
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
        borderRadius: 'var(--radius-xl)', padding: '28px 32px',
        marginBottom: '16px',
        display: 'flex', alignItems: 'center', gap: '40px',
      }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Current Reading
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '64px', fontWeight: 800, color: sensor.color, lineHeight: 1, letterSpacing: '-2px' }}>
              {latest}
            </span>
            <span style={{ fontSize: '24px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{sensor.unit}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
            <span style={{
              background: statusColor + '18', color: statusColor,
              border: `1px solid ${statusColor}30`,
              borderRadius: '20px', padding: '3px 10px',
              fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px',
            }}>
              {sensorData.status}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: trendColor }}>
              <TrendIcon size={13} strokeWidth={2.5} />
              {sensorData.trend === 'stable' ? 'Stable' : sensorData.trend === 'up' ? 'Rising' : 'Falling'}
            </span>
          </div>
        </div>

        {/* Optimal range gauge */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Range · {sensor.min}{sensor.unit} — {sensor.max}{sensor.unit}
          </div>
          <div style={{ position: 'relative', height: '12px', background: 'var(--bg-elevated)', borderRadius: '6px', overflow: 'visible' }}>
            {/* Optimal zone */}
            <div style={{
              position: 'absolute',
              left: `${(sensor.optimalMin / sensor.max) * 100}%`,
              width: `${((sensor.optimalMax - sensor.optimalMin) / sensor.max) * 100}%`,
              height: '100%',
              background: sensor.color + '25',
              border: `1px solid ${sensor.color}40`,
              borderRadius: '4px',
            }} />
            {/* Current marker */}
            <div style={{
              position: 'absolute',
              left: `calc(${(latest / sensor.max) * 100}% - 6px)`,
              top: '-3px',
              width: '18px', height: '18px',
              borderRadius: '50%',
              background: sensor.color,
              boxShadow: `0 0 10px ${sensor.color}80`,
              border: '2px solid var(--bg-card)',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
            <span>{sensor.min}{sensor.unit}</span>
            <span style={{ color: sensor.color + 'cc' }}>Optimal: {sensor.optimalMin}–{sensor.optimalMax}{sensor.unit}</span>
            <span>{sensor.max}{sensor.unit}</span>
          </div>
        </div>

        {/* Stat boxes */}
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
          <StatBox label="24h Min" value={`${min}${sensor.unit}`} />
          <StatBox label="24h Max" value={`${max}${sensor.unit}`} />
          <StatBox label="Average" value={`${avg}${sensor.unit}`} color={sensor.color} />
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Main area chart */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', fontFamily: 'var(--font-display)' }}>
            24-Hour Trend
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="sensorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={sensor.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={sensor.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-primary)' }}
                formatter={(v: number) => [`${v}${sensor.unit}`, sensor.label]}
                labelFormatter={(l) => `Time: ${l}`}
              />
              <ReferenceLine y={sensor.optimalMin} stroke={sensor.color + '40'} strokeDasharray="4 4" />
              <ReferenceLine y={sensor.optimalMax} stroke={sensor.color + '40'} strokeDasharray="4 4" />
              <Area type="monotone" dataKey="value" stroke={sensor.color} strokeWidth={2} fill="url(#sensorGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: sensor.color }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', fontFamily: 'var(--font-display)' }}>
            4-Hour Averages
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-primary)' }}
                formatter={(v: number) => [`${v}${sensor.unit}`, 'Avg']}
              />
              <Bar dataKey="avg" fill={sensor.color + '80'} stroke={sensor.color} strokeWidth={1} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alert thresholds info */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '18px 20px',
        display: 'flex', gap: '32px', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={14} color="var(--text-muted)" />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Alert Thresholds</span>
        </div>
        {[
          { label: 'Warning below', value: `${sensor.optimalMin}${sensor.unit}`, color: '#fbbf24' },
          { label: 'Warning above', value: `${sensor.optimalMax}${sensor.unit}`, color: '#fbbf24' },
          { label: 'Critical below', value: `${Math.round(sensor.optimalMin * 0.7)}${sensor.unit}`, color: '#f87171' },
          { label: 'Critical above', value: `${Math.round(sensor.optimalMax * 1.2)}${sensor.unit}`, color: '#f87171' },
        ].map(t => (
          <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={12} color={t.color} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.label}:</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: t.color }}>{t.value}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <button style={{
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '5px 14px',
            fontSize: '11px', color: 'var(--text-secondary)', cursor: 'pointer',
          }}>
            Edit Thresholds
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sensors;
