import React from 'react';

interface Props {
  /** Rendered pixel size (square). */
  size?: number;
  /** 'full' = whole potted seedling scene; 'head' = just the animated face, for small avatar slots. */
  variant?: 'full' | 'head';
  /** Wave the front leaf like a greeting instead of the idle sway. */
  wave?: boolean;
  /** Turn off the floating bob (e.g. inside a tight header). */
  float?: boolean;
  style?: React.CSSProperties;
}

/**
 * "Sprout" — the AgroSense mascot.
 *
 * A friendly seedling rendered as pure SVG + CSS with no external assets. The
 * depth comes from radial shading, a specular highlight and a drop-shadow, plus
 * a ground shadow that breathes with the bob, so it reads as a little 3D
 * character rather than a flat icon.
 */
const Mascot: React.FC<Props> = ({ size = 140, variant = 'full', wave = false, float = true, style }) => {
  // Unique gradient ids so several mascots on one page never collide.
  const uid = React.useId().replace(/:/g, '');
  const id = (name: string) => `m-${name}-${uid}`;

  const isHead = variant === 'head';
  const viewBox = isHead ? '18 26 124 104' : '0 0 160 170';
  const glowBg = `radial-gradient(circle at 50% ${isHead ? 46 : 42}%, rgba(93,234,138,0.22) 0%, transparent 65%)`;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}>
      <div style={{ position: 'absolute', inset: 0, background: glowBg, animation: 'mascot-glow 3s ease-in-out infinite', pointerEvents: 'none' }} />
      <svg width={size} height={size} viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
        <defs>
          {/* Rounded, lit body — bright at top-left, shaded bottom-right for a 3D sphere feel */}
          <radialGradient id={id('body')} cx="38%" cy="30%" r="78%">
            <stop offset="0%" stopColor="#b6f9cd" />
            <stop offset="42%" stopColor="#6eef98" />
            <stop offset="100%" stopColor="#2f9d5a" />
          </radialGradient>
          <linearGradient id={id('leaf')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8ff4b0" /><stop offset="100%" stopColor="#33a862" />
          </linearGradient>
          <linearGradient id={id('leaf2')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7bf2a3" /><stop offset="100%" stopColor="#2c8f53" />
          </linearGradient>
          <linearGradient id={id('pot')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#33482f" /><stop offset="55%" stopColor="#20301d" /><stop offset="100%" stopColor="#141d13" />
          </linearGradient>
          <linearGradient id={id('rim')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3c5638" /><stop offset="100%" stopColor="#243420" />
          </linearGradient>
          <radialGradient id={id('cheek')} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff9ea0" stopOpacity="0.55" /><stop offset="100%" stopColor="#ff9ea0" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ground shadow — stays put while the body bobs */}
        {!isHead && (
          <ellipse cx="80" cy="160" rx="33" ry="6" fill="#000" style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: float ? 'mascot-shadow 3.4s ease-in-out infinite' : 'none', opacity: 0.35 }} />
        )}

        <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: float ? 'mascot-bob 3.4s ease-in-out infinite' : 'none', filter: 'drop-shadow(0 8px 9px rgba(0,0,0,0.35))' }}>
          {/* Back leaf */}
          <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'mascot-sway 4s ease-in-out infinite' }}>
            <path d="M80 96 C 56 84, 40 92, 34 108 C 54 116, 72 110, 80 96 Z" fill={`url(#${id('leaf2')})`} opacity="0.9" />
            <path d="M80 96 C 66 92, 52 96, 44 104" stroke="#1f6b3d" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" fill="none" />
          </g>
          {/* Front leaf — waves on greeting, otherwise sways */}
          <g style={{ transformBox: 'fill-box', transformOrigin: '80px 96px', animation: `${wave ? 'mascot-wave 2.6s ease-in-out infinite' : 'mascot-sway-alt 4s ease-in-out infinite'}` }}>
            <path d="M80 96 C 104 84, 120 92, 126 108 C 106 116, 88 110, 80 96 Z" fill={`url(#${id('leaf')})`} />
            <path d="M80 96 C 94 92, 108 96, 116 104" stroke="#1f6b3d" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" fill="none" />
          </g>

          {/* Head / body */}
          <path d="M80 38 C 97 55, 105 70, 105 85 a 25 25 0 0 1 -50 0 C 55 70, 63 55, 80 38 Z" fill={`url(#${id('body')})`} stroke="#2c8f53" strokeWidth="1" />
          {/* Specular highlight for gloss */}
          <ellipse cx="69" cy="60" rx="9" ry="13" fill="#ffffff" opacity="0.28" transform="rotate(-24 69 60)" />
          {/* Cheeks */}
          <circle cx="65" cy="83" r="7.5" fill={`url(#${id('cheek')})`} />
          <circle cx="95" cy="83" r="7.5" fill={`url(#${id('cheek')})`} />
          {/* Eyes (blink) */}
          <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'mascot-blink 4.5s ease-in-out infinite' }}>
            <ellipse cx="71" cy="74" rx="3.5" ry="4.8" fill="#0a1a10" />
            <ellipse cx="89" cy="74" rx="3.5" ry="4.8" fill="#0a1a10" />
            <circle cx="72.3" cy="72" r="1.2" fill="#fff" />
            <circle cx="90.3" cy="72" r="1.2" fill="#fff" />
          </g>
          {/* Smile */}
          <path d="M72 86 Q 80 93.5, 88 86" stroke="#0a1a10" strokeWidth="2.4" strokeLinecap="round" fill="none" />

          {!isHead && (
            <>
              {/* Pot */}
              <rect x="48" y="106" width="64" height="11" rx="5.5" fill={`url(#${id('rim')})`} stroke="#43603c" strokeWidth="1" />
              <path d="M53 117 L107 117 L101 149 a 6 6 0 0 1 -6 5 L61 154 a 6 6 0 0 1 -6 -5 Z" fill={`url(#${id('pot')})`} stroke="#43603c" strokeWidth="1" />
              <path d="M56 121 L59 150" stroke="#000" strokeWidth="3" strokeLinecap="round" opacity="0.18" />

              {/* Falling water drop */}
              <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'mascot-drop 2.4s ease-in infinite' }}>
                <path d="M122 40 c 0 0 6 6 6 10 a 6 6 0 0 1 -12 0 c 0 -4 6 -10 6 -10 z" fill="#5bbfef" />
                <ellipse cx="119.5" cy="47" rx="1.4" ry="2" fill="#fff" opacity="0.7" />
              </g>
            </>
          )}
        </g>
      </svg>
    </div>
  );
};

export default Mascot;
