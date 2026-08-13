import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, ReferenceLine
} from 'recharts';
import { CloudRain, Thermometer, Wind, Droplets, Eye, Sun, AlertTriangle } from 'lucide-react';
import { mockDashboardData } from '../data/mockData';

const extendedForecast = [
  { time: 'Now',  temp: 28, humidity: 62, rain: 5,  wind: 12, condition: 'Sunny',         icon: '☀️',  feels: 30 },
  { time: '3h',   temp: 27, humidity: 68, rain: 20, wind: 15, condition: 'Partly Cloudy',  icon: '⛅',  feels: 28 },
  { time: '6h',   temp: 25, humidity: 75, rain: 45, wind: 18, condition: 'Overcast',        icon: '☁️',  feels: 25 },
  { time: '9h',   temp: 23, humidity: 85, rain: 72, wind: 22, condition: 'Light Rain',      icon: '🌧️', feels: 22 },
  { time: '12h',  temp: 22, humidity: 90, rain: 88, wind: 25, condition: 'Rain',            icon: '⛈️', feels: 20 },
  { time: '15h',  temp: 24, humidity: 80, rain: 30, wind: 14, condition: 'Clearing',        icon: '🌤️', feels: 24 },
  { time: '18h',  temp: 26, humidity: 70, rain: 15, wind: 10, condition: 'Partly Sunny',    icon: '⛅',  feels: 27 },
  { time: '21h',  temp: 23, humidity: 72, rain: 8,  wind: 8,  condition: 'Clear',           icon: '🌙',  feels: 23 },
  { time: '+24h', temp: 29, humidity: 58, rain: 5,  wind: 11, condition: 'Sunny',           icon: '☀️',  feels: 31 },
  { time: '+27h', temp: 31, humidity: 55, rain: 10, wind: 9,  condition: 'Sunny',           icon: '☀️',  feels: 33 },
  { time: '+30h', temp: 30, humidity: 60, rain: 18, wind: 13, condition: 'Partly Cloudy',   icon: '⛅',  feels: 31 },
  { time: '+33h', temp: 27, humidity: 68, rain: 40, wind: 16, condition: 'Cloudy',          icon: '☁️',  feels: 27 },
];

const irrigationAdvice = [
  { time: 'Now',  zone: 'Zone 1 (North)',  action: 'Irrigate',  reason: 'Soil moisture at 38% — below threshold', color: '#4ade80' },
  { time: '6h',   zone: 'Zone 2 (South)',  action: 'Hold',      reason: 'Rain likely at 9h (72%)', color: '#f5a623' },
  { time: '9h',   zone: 'All Zones',       action: 'Pause',     reason: 'Rain forecast — auto-pause triggered', color: '#5bbfef' },
  { time: '15h',  zone: 'Zone 3 (East)',   action: 'Resume',    reason: 'Rain clears, moisture check needed', color: '#4ade80' },
];

const Weather: React.FC = () => {
  const rainPeak = extendedForecast.reduce((a, b) => b.rain > a.rain ? b : a);

  return (
    <div style={{ padding: '28px 32px', overflowY: 'auto', height: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: '4px' }}>
            Weather Forecast
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            36-hour outlook · Irrigation impact analysis
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{
            background: 'rgba(91,191,239,0.08)', border: '1px solid rgba(91,191,239,0.2)',
            borderRadius: 'var(--radius-sm)', padding: '7px 14px',
            fontSize: '12px', color: '#5bbfef', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <CloudRain size={13} />
            Peak rain: {rainPeak.time} ({rainPeak.rain}%)
          </div>
        </div>
      </div>

      {/* Current conditions hero */}
      <div style={{
        background: 'linear-gradient(135deg, #162019 0%, #111a14 100%)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)', padding: '28px 32px',
        marginBottom: '16px',
        display: 'flex', gap: '40px', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '56px', marginBottom: '4px' }}>☀️</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-2px', lineHeight: 1 }}>
            28°C
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '6px' }}>Sunny · Feels like 30°C</div>
        </div>

        <div style={{ width: '1px', height: '80px', background: 'var(--border)' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 32px' }}>
          {[
            { Icon: Droplets, label: 'Humidity', value: '62%' },
            { Icon: Wind, label: 'Wind', value: '12 km/h' },
            { Icon: Eye, label: 'Visibility', value: '10 km' },
            { Icon: Sun, label: 'UV Index', value: '7 (High)' },
          ].map(({ Icon, label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Icon size={14} color="var(--text-muted)" />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Location</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Farm · Oyo State</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Updated just now</div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Rain probability chart */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Rain Probability
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#f5a623' }}>
              <AlertTriangle size={11} />
              Irrigation pause at 60%+
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={extendedForecast} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 9 }} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px', color: 'var(--text-primary)' }}
                formatter={(v: number) => [`${v}%`, 'Rain probability']}
              />
              <ReferenceLine y={60} stroke="#f5a623" strokeDasharray="4 4" strokeWidth={1} />
              <Bar dataKey="rain" radius={[3, 3, 0, 0]}
                fill="#5bbfef"
                style={{ filter: 'none' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Temperature line */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Temperature Forecast
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={extendedForecast} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px', color: 'var(--text-primary)' }}
                formatter={(v: number) => [`${v}°C`, 'Temperature']}
              />
              <Line type="monotone" dataKey="temp" stroke="#ff7c5e" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="feels" stroke="#ff7c5e40" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly forecast strip */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '16px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
          Hourly Breakdown
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '6px' }}>
          {extendedForecast.map((item, i) => (
            <div key={i} style={{
              background: item.rain >= 60 ? 'rgba(91,191,239,0.08)' : i === 0 ? 'var(--accent-muted)' : 'var(--bg-surface)',
              border: `1px solid ${item.rain >= 60 ? 'rgba(91,191,239,0.2)' : i === 0 ? 'rgba(93,234,138,0.2)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-sm)', padding: '10px 6px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '9px', color: i === 0 ? 'var(--accent-primary)' : 'var(--text-muted)', marginBottom: '5px', fontWeight: i === 0 ? 600 : 400 }}>{item.time}</div>
              <div style={{ fontSize: '18px', marginBottom: '5px' }}>{item.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{item.temp}°</div>
              <div style={{ height: '3px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden', marginBottom: '3px' }}>
                <div style={{ height: '100%', width: `${item.rain}%`, background: item.rain >= 60 ? '#5bbfef' : '#5bbfef60', borderRadius: '2px' }} />
              </div>
              <div style={{ fontSize: '9px', color: item.rain >= 60 ? '#5bbfef' : 'var(--text-muted)' }}>{item.rain}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Irrigation advisory timeline */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
          Irrigation Advisory · Weather-Based
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {irrigationAdvice.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)', padding: '12px 16px',
            }}>
              <div style={{ width: '40px', fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>{item.time}</div>
              <div style={{ width: '1px', height: '28px', background: 'var(--border)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.zone}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.reason}</div>
              </div>
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '3px 10px',
                borderRadius: '20px',
                background: item.color + '15', color: item.color,
                border: `1px solid ${item.color}30`,
                textTransform: 'uppercase', letterSpacing: '0.4px',
              }}>{item.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Weather;
