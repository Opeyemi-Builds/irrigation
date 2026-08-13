import React, { useEffect, useRef, useState } from 'react';

interface Props {
  level?: number; // 0–100
  capacity?: number; // litres
  flowRate?: number; // L/hr
  status?: 'filling' | 'draining' | 'idle';
}

const Reservoir3D: React.FC<Props> = ({
  level = 67,
  capacity = 5000,
  flowRate = 140,
  status = 'draining',
}) => {
  const [animLevel, setAnimLevel] = useState(level);
  const [wave1, setWave1] = useState(0);
  const [wave2, setWave2] = useState(Math.PI);
  const [bubbles, setBubbles] = useState<{ id: number; x: number; size: number; speed: number; opacity: number; y: number }[]>([]);
  const rafRef = useRef<number>();
  const lastRef = useRef<number>(0);
  const bubbleId = useRef(0);

  useEffect(() => {
    setAnimLevel(level);
  }, [level]);

  useEffect(() => {
    let t = 0;
    const animate = (ts: number) => {
      const dt = Math.min((ts - lastRef.current) / 1000, 0.05);
      lastRef.current = ts;
      t += dt;

      setWave1(t * 1.4);
      setWave2(t * 0.9 + Math.PI * 0.6);

      setBubbles(prev => {
        let next = prev.map(b => ({ ...b, y: b.y - b.speed * dt * 60 })).filter(b => b.y > -10);
        if (Math.random() < 0.07 && status !== 'idle') {
          next.push({ id: bubbleId.current++, x: 15 + Math.random() * 70, size: 2 + Math.random() * 4, speed: 0.3 + Math.random() * 0.5, opacity: 0.4 + Math.random() * 0.4, y: 100 });
        }
        return next.slice(-18);
      });

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [status]);

  const waterColor1 = level > 60 ? '#1e7aad' : level > 30 ? '#2196b8' : '#e06b2d';
  const waterColor2 = level > 60 ? '#1a5f8a' : level > 30 ? '#186a8f' : '#c45020';
  const glowColor  = level > 60 ? 'rgba(91,191,239,0.35)' : level > 30 ? 'rgba(91,191,239,0.2)' : 'rgba(240,100,40,0.3)';
  const statusColor = status === 'draining' ? '#f87171' : status === 'filling' ? '#4ade80' : '#8aab8e';
  const statusLabel = status === 'draining' ? 'Irrigating' : status === 'filling' ? 'Refilling' : 'Standby';

  // Wave path builder
  const buildWave = (phase: number, amplitude: number, yBase: number, width = 100) => {
    const pts: string[] = [];
    for (let x = 0; x <= width; x += 2) {
      const y = yBase + Math.sin((x / width) * Math.PI * 3 + phase) * amplitude
                      + Math.sin((x / width) * Math.PI * 5 + phase * 1.3) * (amplitude * 0.4);
      pts.push(`${x === 0 ? 'M' : 'L'} ${x} ${y}`);
    }
    return pts.join(' ') + ` L ${width} 100 L 0 100 Z`;
  };

  const fillY = 100 - animLevel; // SVG coords: 0=top, 100=bottom

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient glow behind reservoir */}
      <div style={{
        position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
        width: '200px', height: '100px',
        background: `radial-gradient(ellipse, ${glowColor} 0%, transparent 70%)`,
        pointerEvents: 'none',
        transition: 'background 1s ease',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Water Reservoir
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {capacity.toLocaleString()}L capacity
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: statusColor,
            boxShadow: `0 0 8px ${statusColor}`,
            animation: status !== 'idle' ? 'pulse-dot 1.5s ease infinite' : 'none',
          }} />
          <span style={{ fontSize: '11px', color: statusColor, fontWeight: 600 }}>{statusLabel}</span>
        </div>
      </div>

      {/* Main reservoir 3D SVG */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
        {/* The tank */}
        <div style={{ flex: 1, position: 'relative' }}>
          <svg
            viewBox="0 0 160 200"
            style={{ width: '100%', maxWidth: '220px', margin: '0 auto', display: 'block', filter: `drop-shadow(0 8px 32px ${glowColor})` }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Tank body gradient - gives 3D cylinder feel */}
              <linearGradient id="tankBody" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0d1a10" stopOpacity="1" />
                <stop offset="12%" stopColor="#1a2e1d" stopOpacity="1" />
                <stop offset="50%" stopColor="#223228" stopOpacity="1" />
                <stop offset="88%" stopColor="#1a2e1d" stopOpacity="1" />
                <stop offset="100%" stopColor="#0d1a10" stopOpacity="1" />
              </linearGradient>

              {/* Water gradient */}
              <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={waterColor2} stopOpacity="0.85" />
                <stop offset="40%" stopColor={waterColor1} stopOpacity="0.95" />
                <stop offset="100%" stopColor={waterColor2} stopOpacity="0.85" />
              </linearGradient>

              {/* Water surface shimmer */}
              <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                <stop offset="45%" stopColor="rgba(255,255,255,0.12)" />
                <stop offset="55%" stopColor="rgba(255,255,255,0.18)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>

              {/* Top ellipse gradient */}
              <radialGradient id="topEllipse" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#2a4a30" />
                <stop offset="100%" stopColor="#162019" />
              </radialGradient>

              {/* Water clip */}
              <clipPath id="tankClip">
                <rect x="10" y="20" width="140" height="168" rx="4" />
              </clipPath>

              {/* Clip for water inside tank walls */}
              <clipPath id="waterClip">
                <rect x="12" y="22" width="136" height="164" />
              </clipPath>
            </defs>

            {/* ── Tank body ── */}
            {/* Back wall (darkest) */}
            <rect x="10" y="20" width="140" height="168" rx="4" fill="#0e1810" />

            {/* Left wall highlight */}
            <rect x="10" y="20" width="18" height="168" fill="url(#tankBody)" opacity="0.6" />
            {/* Right wall shadow */}
            <rect x="132" y="20" width="18" height="168" fill="#0a1209" opacity="0.8" />

            {/* ── Water fill ── */}
            <g clipPath="url(#waterClip)">
              {/* Base water fill */}
              <rect
                x="12" y={22 + (164 * fillY / 100)}
                width="136" height={164 * animLevel / 100}
                fill={`url(#waterGrad)`}
                style={{ transition: 'y 1.5s ease, height 1.5s ease' }}
              />

              {/* Wave 1 (back) */}
              <g style={{ transform: `translateY(${22 + (164 * fillY / 100) - 6}px) scaleX(1.36) translateX(-18px)`, transition: 'transform 1.5s ease' }}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="136" height="14">
                  <path d={buildWave(wave1, 2.5, 4)} fill={waterColor1} opacity="0.7" />
                </svg>
              </g>

              {/* Wave 2 (front) */}
              <g style={{ transform: `translateY(${22 + (164 * fillY / 100) - 4}px) scaleX(1.36) translateX(-18px)`, transition: 'transform 1.5s ease' }}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="136" height="12">
                  <path d={buildWave(wave2, 2, 4)} fill={waterColor2} opacity="0.9" />
                </svg>
              </g>

              {/* Shimmer on water surface */}
              <rect
                x="12" y={22 + (164 * fillY / 100)}
                width="136" height="20"
                fill="url(#shimmer)"
                style={{ transition: 'y 1.5s ease' }}
              />

              {/* Bubbles */}
              {bubbles.map(b => (
                <circle
                  key={b.id}
                  cx={12 + (b.x / 100) * 136}
                  cy={22 + (164 * fillY / 100) + (164 * animLevel / 100) * (b.y / 100)}
                  r={b.size / 2}
                  fill="none"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="0.5"
                  opacity={b.opacity}
                />
              ))}

              {/* Depth caustic lines */}
              {[0.2, 0.4, 0.65, 0.85].map((t, i) => (
                <line
                  key={i}
                  x1={12 + t * 136 - 8}
                  y1={22 + (164 * fillY / 100) + 20}
                  x2={12 + t * 136 + 6}
                  y2={22 + (164 * fillY / 100) + 60}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1.5"
                />
              ))}
            </g>

            {/* ── Tank frame / ribs ── */}
            {[60, 100, 140].map(y => (
              <g key={y}>
                <rect x="10" y={y} width="140" height="3" fill="#0a1209" opacity="0.9" />
                <rect x="10" y={y} width="140" height="1" fill="rgba(255,255,255,0.04)" />
              </g>
            ))}

            {/* ── Left side stripes (metallic) ── */}
            <rect x="10" y="20" width="3" height="168" fill="rgba(255,255,255,0.06)" />
            <rect x="147" y="20" width="3" height="168" fill="rgba(0,0,0,0.4)" />

            {/* ── Top opening ellipse ── */}
            <ellipse cx="80" cy="22" rx="70" ry="10" fill="url(#topEllipse)" stroke="#2a3d2d" strokeWidth="1" />
            <ellipse cx="80" cy="22" rx="70" ry="10" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            {/* Inner top ring */}
            <ellipse cx="80" cy="22" rx="60" ry="7" fill="none" stroke="#1e2d21" strokeWidth="1" />

            {/* ── Bottom ellipse (3D base) ── */}
            <ellipse cx="80" cy="188" rx="70" ry="8" fill="#0a1209" />
            <ellipse cx="80" cy="188" rx="70" ry="8" fill="none" stroke="#2a3d2d" strokeWidth="1" />

            {/* ── Level marker lines on right side ── */}
            {[25, 50, 75].map(pct => {
              const markerY = 22 + (164 * (1 - pct / 100));
              const isAboveWater = pct > animLevel;
              return (
                <g key={pct}>
                  <line x1="145" y1={markerY} x2="155" y2={markerY} stroke={isAboveWater ? '#2a3d2d' : 'rgba(91,191,239,0.5)'} strokeWidth="1" />
                  <text x="157" y={markerY + 3} fontSize="6" fill={isAboveWater ? '#4d6b51' : '#5bbfef'} fontFamily="monospace">{pct}%</text>
                </g>
              );
            })}

            {/* ── Current level indicator ── */}
            <line
              x1="8"
              y1={22 + (164 * fillY / 100)}
              x2="152"
              y2={22 + (164 * fillY / 100)}
              stroke="rgba(93,234,138,0.6)"
              strokeWidth="0.75"
              strokeDasharray="3 3"
              style={{ transition: 'y1 1.5s ease, y2 1.5s ease' }}
            />
            <circle
              cx="8"
              cy={22 + (164 * fillY / 100)}
              r="3"
              fill="var(--accent-primary)"
              style={{ transition: 'cy 1.5s ease' }}
            />

            {/* ── Pipe at bottom left ── */}
            <rect x="2" y="178" width="12" height="8" rx="2" fill="#0d1810" stroke="#2a3d2d" strokeWidth="1" />
            <rect x="0" y="179" width="4" height="6" rx="1" fill="#0d1810" stroke="#2a3d2d" strokeWidth="0.5" />
            {status === 'draining' && (
              <>
                <rect x="0" y="180" width="2" height="2" fill={waterColor1} opacity="0.9" />
                <rect x="-2" y="181" width="2" height="1.5" fill={waterColor1} opacity="0.6" />
              </>
            )}

            {/* ── Pipe at top right (fill pipe) ── */}
            <rect x="148" y="28" width="8" height="20" rx="2" fill="#0d1810" stroke="#2a3d2d" strokeWidth="1" />
            <rect x="152" y="24" width="6" height="6" rx="2" fill="#0d1810" stroke="#2a3d2d" strokeWidth="0.5" />
            {status === 'filling' && (
              <>
                <rect x="154" y="40" width="2" height="8" fill={waterColor1} opacity="0.8" />
              </>
            )}
          </svg>
        </div>

        {/* Right side stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '130px' }}>
          {/* Big level display */}
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Water Level</div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '36px', fontWeight: 800,
              letterSpacing: '-1px', lineHeight: 1,
              color: level > 60 ? '#5bbfef' : level > 30 ? '#fbbf24' : '#f87171',
              textShadow: `0 0 20px ${level > 60 ? 'rgba(91,191,239,0.4)' : level > 30 ? 'rgba(251,191,36,0.4)' : 'rgba(248,113,113,0.4)'}`,
              transition: 'color 1s ease',
            }}>
              {Math.round(animLevel)}
              <span style={{ fontSize: '16px', fontWeight: 600, opacity: 0.7 }}>%</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {Math.round(capacity * animLevel / 100).toLocaleString()}L
            </div>
          </div>

          {/* Stats */}
          {[
            { label: 'Flow Rate', value: status === 'idle' ? '0 L/hr' : `${flowRate} L/hr`, color: status === 'draining' ? '#f87171' : '#4ade80' },
            { label: 'Est. Empty', value: status === 'draining' ? `${Math.round((capacity * level / 100) / flowRate)}h` : '—', color: 'var(--text-secondary)' },
            { label: 'Capacity', value: `${capacity.toLocaleString()}L`, color: 'var(--text-secondary)' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
            }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
            </div>
          ))}

          {/* Warning */}
          {level <= 30 && (
            <div style={{
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 10px',
              fontSize: '11px', color: '#f87171',
              lineHeight: 1.4,
            }}>
              ⚠️ Low water — refill soon
            </div>
          )}
        </div>
      </div>

      {/* Bottom flow visualization */}
      <div style={{ marginTop: '16px', position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
          Daily usage · last 7 days
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '28px' }}>
          {[65, 72, 55, 80, 68, 74, level].map((v, i) => (
            <div key={i} style={{
              flex: 1,
              height: `${(v / 100) * 28}px`,
              background: i === 6
                ? 'var(--accent-primary)'
                : `rgba(91,191,239,${0.2 + (v / 100) * 0.4})`,
              borderRadius: '2px 2px 0 0',
              transition: 'height 0.6s ease',
              boxShadow: i === 6 ? '0 0 8px var(--accent-glow)' : 'none',
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'T'].map((d, i) => (
            <span key={i} style={{ fontSize: '9px', color: i === 6 ? 'var(--accent-primary)' : 'var(--text-muted)', flex: 1, textAlign: 'center' }}>{d}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reservoir3D;
