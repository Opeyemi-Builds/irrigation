import React, { useEffect, useRef, useState } from 'react';
import { IrrigationZone } from '../types';

interface Props {
  zones: IrrigationZone[];
}

// Polygon definitions for each zone (visual layout of the farm)
const ZONE_SHAPES = [
  // North Field - top-left large
  { id: 'z1', points: '20,15 85,15 85,80 20,80', label: 'North', cx: 52, cy: 47 },
  // South Field - bottom-left
  { id: 'z2', points: '20,85 85,85 85,145 20,145', label: 'South', cx: 52, cy: 115 },
  // East Patch - right column top
  { id: 'z3', points: '90,15 155,15 155,80 90,80', label: 'East', cx: 122, cy: 47 },
  // West Field - right column bottom
  { id: 'z4', points: '90,85 155,85 155,145 90,145', label: 'West', cx: 122, cy: 115 },
];

const getMoistureColor = (moisture: number | null, status: string): { fill: string; stroke: string; glow: string } => {
  if (status === 'active') return { fill: 'rgba(93,234,138,0.22)', stroke: '#5dea8a', glow: 'rgba(93,234,138,0.5)' };
  if (moisture == null) return { fill: 'rgba(120,140,125,0.06)', stroke: '#3a4d3e', glow: 'rgba(77,107,81,0.2)' };
  if (moisture >= 70) return { fill: 'rgba(91,191,239,0.18)', stroke: '#5bbfef', glow: 'rgba(91,191,239,0.4)' };
  if (moisture >= 50) return { fill: 'rgba(74,222,128,0.14)', stroke: '#4ade80', glow: 'rgba(74,222,128,0.3)' };
  if (moisture >= 35) return { fill: 'rgba(251,191,36,0.15)', stroke: '#fbbf24', glow: 'rgba(251,191,36,0.35)' };
  return { fill: 'rgba(248,113,113,0.15)', stroke: '#f87171', glow: 'rgba(248,113,113,0.35)' };
};

const getMoistureLabel = (moisture: number | null) => {
  if (moisture == null) return 'No data';
  if (moisture >= 70) return 'Saturated';
  if (moisture >= 50) return 'Healthy';
  if (moisture >= 35) return 'Low';
  return 'Dry';
};

// Particle = an irrigation droplet flowing along a path
interface Particle { id: number; progress: number; zoneId: string; speed: number }

const FieldMap: React.FC<Props> = ({ zones }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [pulseScale, setPulseScale] = useState(1);
  const rafRef = useRef<number>();
  const lastRef = useRef<number>(0);
  const pId = useRef(0);

  useEffect(() => {
    let t = 0;
    const animate = (ts: number) => {
      const dt = Math.min((ts - lastRef.current) / 1000, 0.05);
      lastRef.current = ts;
      t += dt;

      setPulseScale(1 + Math.sin(t * 2.5) * 0.06);

      setParticles(prev => {
        const activeIds = zones.filter(z => z.status === 'active').map(z => z.id);
        let next = prev
          .map(p => ({ ...p, progress: p.progress + p.speed * dt }))
          .filter(p => p.progress < 1);

        activeIds.forEach(zid => {
          const existing = next.filter(p => p.zoneId === zid).length;
          if (existing < 5 && Math.random() < 0.06) {
            next.push({ id: pId.current++, progress: 0, zoneId: zid, speed: 0.15 + Math.random() * 0.2 });
          }
        });
        return next.slice(-30);
      });

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [zones]);

  // Particle position along a spiral/drip path within zone
  const getParticlePos = (zoneId: string, progress: number): { x: number; y: number } => {
    const shape = ZONE_SHAPES.find(s => s.id === zoneId);
    if (!shape) return { x: 0, y: 0 };
    // Drip from top of zone downward in a slight zigzag
    const pts = shape.points.split(' ').map(p => p.split(',').map(Number));
    const minX = Math.min(...pts.map(p => p[0]));
    const maxX = Math.max(...pts.map(p => p[0]));
    const minY = Math.min(...pts.map(p => p[1]));
    const maxY = Math.max(...pts.map(p => p[1]));
    const startX = shape.cx + Math.sin(pId.current * 1.7) * (maxX - minX) * 0.3;
    const x = startX + Math.sin(progress * Math.PI * 4 + pId.current) * 4;
    const y = minY + progress * (maxY - minY);
    return { x, y };
  };

  const knownMoistures = zones.map(z => z.moisture).filter((m): m is number => m != null);
  const overallHealth = knownMoistures.length ? Math.round(knownMoistures.reduce((a, b) => a + b, 0) / knownMoistures.length) : null;
  const healthColor = overallHealth == null ? 'var(--text-muted)' : overallHealth >= 60 ? '#4ade80' : overallHealth >= 40 ? '#fbbf24' : '#f87171';

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ground glow */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', height: '60%',
        background: `radial-gradient(ellipse, rgba(93,234,138,0.04) 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', position: 'relative', zIndex: 1 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Field Health Map
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Live soil moisture · top-down view
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, color: healthColor, letterSpacing: '-0.5px', lineHeight: 1 }}>
            {overallHealth == null ? '—' : `${overallHealth}%`}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>avg moisture</div>
        </div>
      </div>

      {/* SVG Map */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <svg
          viewBox="0 0 175 160"
          style={{ width: '100%', filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.4))' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Soil texture pattern */}
            <pattern id="soilTexture" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
              <rect width="4" height="4" fill="transparent" />
              <circle cx="1" cy="1" r="0.3" fill="rgba(255,255,255,0.03)" />
              <circle cx="3" cy="3" r="0.3" fill="rgba(255,255,255,0.03)" />
            </pattern>

            {zones.map(zone => {
              const col = getMoistureColor(zone.moisture, zone.status);
              return (
                <radialGradient key={zone.id} id={`zoneGrad-${zone.id}`} cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor={col.stroke} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={col.stroke} stopOpacity="0.06" />
                </radialGradient>
              );
            })}

            {/* Active pulse filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Farm boundary */}
          <rect x="16" y="11" width="143" height="138" rx="4" fill="#0a1209" stroke="#1e2d21" strokeWidth="1" />
          {/* Soil texture overlay */}
          <rect x="16" y="11" width="143" height="138" rx="4" fill="url(#soilTexture)" />

          {/* Central path (dirt road between zones) */}
          <rect x="86" y="11" width="3" height="138" fill="#0d1810" opacity="0.8" />
          <rect x="16" y="81" width="143" height="3" fill="#0d1810" opacity="0.8" />

          {/* Zones */}
          {ZONE_SHAPES.map(shape => {
            const zone = zones.find(z => z.id === shape.id);
            if (!zone) return null;
            const mv = zone.moisture;
            const hasM = mv != null;
            const col = getMoistureColor(mv, zone.status);
            const isActive = zone.status === 'active';

            return (
              <g key={shape.id}>
                {/* Zone fill */}
                <polygon
                  points={shape.points}
                  fill={`url(#zoneGrad-${shape.id})`}
                  stroke={col.stroke}
                  strokeWidth={isActive ? '1.5' : '0.75'}
                  strokeOpacity={isActive ? 1 : 0.5}
                />

                {/* Soil texture on top */}
                <polygon points={shape.points} fill="url(#soilTexture)" />

                {/* Moisture heat dots — mini grid */}
                {Array.from({ length: 12 }, (_, i) => {
                  const pts = shape.points.split(' ').map(p => p.split(',').map(Number));
                  const minX = Math.min(...pts.map(p => p[0])) + 5;
                  const maxX = Math.max(...pts.map(p => p[0])) - 5;
                  const minY = Math.min(...pts.map(p => p[1])) + 5;
                  const maxY = Math.max(...pts.map(p => p[1])) - 5;
                  const cols = 4, rows = 3;
                  const col2 = i % cols;
                  const row = Math.floor(i / cols);
                  const cx = minX + (col2 / (cols - 1)) * (maxX - minX);
                  const cy = minY + (row / (rows - 1)) * (maxY - minY);
                  const jitter = (Math.sin(i * 7.3 + shape.cx) * 3);
                  const intensity = ((zone.moisture ?? 0) / 100) * (0.6 + Math.sin(i * 2.1) * 0.4);
                  return (
                    <circle
                      key={i}
                      cx={cx + jitter}
                      cy={cy + jitter * 0.5}
                      r={1.2 + intensity * 1.5}
                      fill={col.stroke}
                      opacity={0.08 + intensity * 0.18}
                    />
                  );
                })}

                {/* Active pulse ring */}
                {isActive && (
                  <polygon
                    points={shape.points}
                    fill="none"
                    stroke={col.stroke}
                    strokeWidth="2"
                    opacity="0.6"
                    style={{
                      transformOrigin: `${shape.cx}px ${shape.cy}px`,
                      transform: `scale(${pulseScale})`,
                      filter: `drop-shadow(0 0 6px ${col.glow})`,
                    }}
                  />
                )}

                {/* Zone label */}
                <text
                  x={shape.cx}
                  y={shape.cy - 8}
                  textAnchor="middle"
                  fontSize="7"
                  fontWeight="700"
                  fill={col.stroke}
                  opacity="0.9"
                  fontFamily="monospace"
                >
                  {shape.label}
                </text>
                <text
                  x={shape.cx}
                  y={shape.cy + 2}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="800"
                  fill="white"
                  opacity="0.9"
                  fontFamily="monospace"
                >
                  {zone.moisture != null ? `${zone.moisture}%` : '—'}
                </text>
                <text
                  x={shape.cx}
                  y={shape.cy + 11}
                  textAnchor="middle"
                  fontSize="5.5"
                  fill={col.stroke}
                  opacity="0.8"
                  fontFamily="monospace"
                >
                  {getMoistureLabel(zone.moisture)}
                </text>

                {/* Status badge */}
                {isActive && (
                  <g>
                    <rect x={shape.cx - 10} y={shape.cy + 14} width="20" height="7" rx="3.5" fill={col.stroke} opacity="0.9" />
                    <text x={shape.cx} y={shape.cy + 19.5} textAnchor="middle" fontSize="4.5" fontWeight="700" fill="#071009" fontFamily="monospace">
                      ACTIVE
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Irrigation droplet particles */}
          {particles.map(p => {
            const pos = getParticlePos(p.zoneId, p.progress);
            const zone = zones.find(z => z.id === p.zoneId);
            if (!zone) return null;
            const col = getMoistureColor(zone.moisture, zone.status);
            return (
              <circle
                key={p.id}
                cx={pos.x}
                cy={pos.y}
                r={1.2}
                fill={col.stroke}
                opacity={0.7 * (1 - p.progress)}
                filter="url(#glow)"
              />
            );
          })}

          {/* Compass rose */}
          <g transform="translate(160, 20)">
            <circle cx="0" cy="0" r="7" fill="#0d1810" stroke="#1e2d21" strokeWidth="0.5" />
            <text x="0" y="-3" textAnchor="middle" fontSize="4" fill="var(--accent-primary)" fontWeight="700" fontFamily="monospace">N</text>
            <line x1="0" y1="-6" x2="0" y2="6" stroke="#2a3d2d" strokeWidth="0.5" />
            <line x1="-6" y1="0" x2="6" y2="0" stroke="#2a3d2d" strokeWidth="0.5" />
          </g>

          {/* Scale bar */}
          <g transform="translate(18, 154)">
            <line x1="0" y1="0" x2="20" y2="0" stroke="#2a3d2d" strokeWidth="0.75" />
            <line x1="0" y1="-2" x2="0" y2="2" stroke="#2a3d2d" strokeWidth="0.75" />
            <line x1="20" y1="-2" x2="20" y2="2" stroke="#2a3d2d" strokeWidth="0.75" />
            <text x="10" y="-3" textAnchor="middle" fontSize="4" fill="#4d6b51" fontFamily="monospace">50m</text>
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px', position: 'relative', zIndex: 1 }}>
        {[
          { color: '#f87171', label: 'Dry (<35%)' },
          { color: '#fbbf24', label: 'Low (35–50%)' },
          { color: '#4ade80', label: 'Healthy (50–70%)' },
          { color: '#5bbfef', label: 'Saturated (>70%)' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: l.color, opacity: 0.8 }} />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FieldMap;
