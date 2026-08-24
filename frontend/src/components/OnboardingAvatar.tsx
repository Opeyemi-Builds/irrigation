import React from 'react';

interface Props {
  step: 'account' | 'device' | 'crop' | 'done';
  compact?: boolean;
}

const CAPTIONS: Record<Props['step'], { title: string; line: string }> = {
  account: { title: "Hi, I'm Sprout!", line: "Let's set up your account and get your farm growing." },
  device:  { title: 'Great to meet you!', line: 'Now connect your AgroSense device so I can read your field.' },
  crop:    { title: 'Almost there!', line: "Tell me what you're growing and I'll tailor every tip to it." },
  done:    { title: 'All set!', line: 'Your live dashboard is ready.' },
};

// A friendly animated seedling mascot — pure SVG + CSS, no external assets.
const OnboardingAvatar: React.FC<Props> = ({ step, compact }) => {
  const cap = CAPTIONS[step] ?? CAPTIONS.account;
  const size = compact ? 116 : 172;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: compact ? '10px' : '18px' }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '28px', height: '28px', background: 'var(--accent-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px var(--accent-glow)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3s7 7.5 7 12a7 7 0 1 1-14 0c0-4.5 7-12 7-12z" fill="#071009" /></svg>
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)' }}>AgroSense</span>
      </div>

      {/* Animated mascot */}
      <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 45%, rgba(93,234,138,0.22) 0%, transparent 65%)', animation: 'mascot-glow 3s ease-in-out infinite' }} />
        <div style={{ animation: 'mascot-float 3.4s ease-in-out infinite' }}>
          <svg width={size} height={size} viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="ob-leaf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7bf2a3" /><stop offset="100%" stopColor="#3db86a" />
              </linearGradient>
              <linearGradient id="ob-pot" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2a3d2d" /><stop offset="100%" stopColor="#161f17" />
              </linearGradient>
              <radialGradient id="ob-cheek" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#5dea8a" stopOpacity="0.7" /><stop offset="100%" stopColor="#5dea8a" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Back leaf */}
            <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'mascot-sway 4s ease-in-out infinite' }}>
              <path d="M80 96 C 56 84, 40 92, 34 108 C 54 116, 72 110, 80 96 Z" fill="url(#ob-leaf)" opacity="0.85" />
            </g>
            {/* Front leaf */}
            <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'mascot-sway-alt 4s ease-in-out infinite' }}>
              <path d="M80 96 C 104 84, 120 92, 126 108 C 106 116, 88 110, 80 96 Z" fill="url(#ob-leaf)" />
            </g>

            {/* Head / body */}
            <path d="M80 40 C 96 56, 104 70, 104 84 a 24 24 0 0 1 -48 0 C 56 70, 64 56, 80 40 Z" fill="url(#ob-leaf)" />
            {/* Cheeks */}
            <circle cx="66" cy="82" r="8" fill="url(#ob-cheek)" />
            <circle cx="94" cy="82" r="8" fill="url(#ob-cheek)" />
            {/* Eyes (blink) */}
            <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'mascot-blink 4.5s ease-in-out infinite' }}>
              <ellipse cx="71" cy="74" rx="3.4" ry="4.6" fill="#0a1a10" />
              <ellipse cx="89" cy="74" rx="3.4" ry="4.6" fill="#0a1a10" />
              <circle cx="72.2" cy="72.2" r="1.1" fill="#fff" />
              <circle cx="90.2" cy="72.2" r="1.1" fill="#fff" />
            </g>
            {/* Smile */}
            <path d="M72 86 Q 80 93, 88 86" stroke="#0a1a10" strokeWidth="2.4" strokeLinecap="round" fill="none" />

            {/* Pot */}
            <rect x="49" y="106" width="62" height="10" rx="5" fill="#22331f" stroke="#2a3d2d" strokeWidth="1.5" />
            <path d="M53 116 L107 116 L101 147 a 6 6 0 0 1 -6 5 L59 152 a 6 6 0 0 1 -6 -5 Z" fill="url(#ob-pot)" stroke="#2a3d2d" strokeWidth="1.5" />

            {/* Falling water drop */}
            <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'mascot-drop 2.2s ease-in infinite' }}>
              <path d="M122 42 c 0 0 6 6 6 10 a 6 6 0 0 1 -12 0 c 0 -4 6 -10 6 -10 z" fill="#5bbfef" />
            </g>
          </svg>
        </div>
      </div>

      {/* Speech caption */}
      <div style={{ maxWidth: '250px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: compact ? '15px' : '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>{cap.title}</div>
        <div style={{ fontSize: compact ? '12px' : '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{cap.line}</div>
      </div>
    </div>
  );
};

export default OnboardingAvatar;
