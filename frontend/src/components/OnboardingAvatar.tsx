import React from 'react';
import Mascot from './Mascot';

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
  const size = compact ? 132 : 188;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: compact ? '6px' : '12px' }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '28px', height: '28px', background: 'var(--accent-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px var(--accent-glow)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3s7 7.5 7 12a7 7 0 1 1-14 0c0-4.5 7-12 7-12z" fill="#071009" /></svg>
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>AgroSense</span>
      </div>

      {/* Animated mascot */}
      <Mascot size={size} wave={step === 'account' || step === 'done'} />

      {/* Speech caption */}
      <div style={{ maxWidth: '250px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: compact ? '15px' : '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{cap.title}</div>
        <div style={{ fontSize: compact ? '12px' : '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{cap.line}</div>
      </div>
    </div>
  );
};

export default OnboardingAvatar;
