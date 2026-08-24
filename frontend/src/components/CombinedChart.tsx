import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { HistoryPoint } from '../types';
import { format } from 'date-fns';
import { LineChart as LineChartIcon } from 'lucide-react';
import EmptyState from './EmptyState';

interface Props {
  history: HistoryPoint[];
}

const CombinedChart: React.FC<Props> = ({ history }) => {
  const [activeLines, setActiveLines] = useState({ temperature: true, humidity: true, soilMoisture: true });

  const chartData = history.map(p => ({
    time: format(new Date(p.timestamp), 'HH:mm:ss'),
    temperature: p.temperature,
    humidity: p.humidity,
    soilMoisture: p.soilMoisture,
  }));

  const lines = [
    { key: 'temperature', color: 'var(--amber)', label: 'Temperature (°C)' },
    { key: 'humidity', color: 'var(--blue)', label: 'Humidity (%)' },
    { key: 'soilMoisture', color: 'var(--accent-primary)', label: 'Soil Moisture (%)' },
  ];

  const hasEnough = chartData.length >= 2;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Sensor Trends
        </h3>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Live · this session</span>
      </div>

      {!hasEnough ? (
        <EmptyState
          icon={<LineChartIcon size={22} />}
          title="No readings yet"
          message="Live sensor trends will draw here as your device reports temperature, humidity, and soil moisture."
        />
      ) : (
        <>
          {/* Toggle lines */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {lines.map(({ key, color, label }) => {
              const on = activeLines[key as keyof typeof activeLines];
              return (
                <button
                  key={key}
                  onClick={() => setActiveLines(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    border: `1px solid ${on ? color : 'var(--border)'}`,
                    background: on ? 'var(--bg-elevated)' : 'transparent',
                    color: on ? color : 'var(--text-muted)',
                    fontSize: '11px', fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ width: '8px', height: '2px', background: on ? color : 'var(--text-muted)', borderRadius: '1px' }} />
                  {label}
                </button>
              );
            })}
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(chartData.length / 6))} />
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
                    connectNulls
                  />
                )
              )}
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
};

export default CombinedChart;
