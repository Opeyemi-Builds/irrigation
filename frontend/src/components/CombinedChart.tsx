import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import { DashboardData } from '../types';
import { format } from 'date-fns';

interface Props {
  data: DashboardData;
}

type Range = '6h' | '12h' | '24h';

const CombinedChart: React.FC<Props> = ({ data }) => {
  const [range, setRange] = useState<Range>('24h');
  const [activeLines, setActiveLines] = useState({ temperature: true, humidity: true, soilMoisture: true });

  const points = range === '6h' ? 6 : range === '12h' ? 12 : 24;

  const chartData = data.temperature.history.slice(-points).map((item, i) => ({
    time: format(new Date(item.timestamp), 'HH:mm'),
    temperature: item.value,
    humidity: data.humidity.history.slice(-points)[i]?.value,
    soilMoisture: data.soilMoisture.history.slice(-points)[i]?.value,
  }));

  const lines = [
    { key: 'temperature', color: '#ff7c5e', label: 'Temperature (°C)' },
    { key: 'humidity', color: 'var(--blue)', label: 'Humidity (%)' },
    { key: 'soilMoisture', color: 'var(--accent-primary)', label: 'Soil Moisture (%)' },
  ];

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Sensor Trends
        </h3>
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['6h', '12h', '24h'] as Range[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                background: range === r ? 'var(--accent-muted)' : 'transparent',
                color: range === r ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontSize: '11px', fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >{r}</button>
          ))}
        </div>
      </div>

      {/* Toggle lines */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        {lines.map(({ key, color, label }) => (
          <button
            key={key}
            onClick={() => setActiveLines(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              border: `1px solid ${activeLines[key as keyof typeof activeLines] ? color + '50' : 'var(--border)'}`,
              background: activeLines[key as keyof typeof activeLines] ? color + '15' : 'transparent',
              color: activeLines[key as keyof typeof activeLines] ? color : 'var(--text-muted)',
              fontSize: '11px', fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <div style={{ width: '8px', height: '2px', background: activeLines[key as keyof typeof activeLines] ? color : 'var(--text-muted)', borderRadius: '1px' }} />
            {label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} interval={Math.floor(points / 6)} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--text-primary)',
            }}
            cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
          />
          {lines.map(({ key, color }) =>
            activeLines[key as keyof typeof activeLines] && (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            )
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CombinedChart;
