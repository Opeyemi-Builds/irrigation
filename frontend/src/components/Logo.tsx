import React, { useState } from 'react';
import { Droplets } from 'lucide-react';

// Brand logo. Renders the AgroSense (AGS) logo image from public/logo.png inside a
// clean rounded tile so it reads well on the dark UI. If that file hasn't been
// added yet, it gracefully falls back to the original droplet emblem — so the
// brand mark never breaks, whether or not the image is present.
interface LogoProps {
  size?: number;    // tile size in px
  radius?: number;  // corner radius; defaults to ~28% of size
  glow?: boolean;   // accent glow shadow (on by default)
}

const Logo: React.FC<LogoProps> = ({ size = 36, radius, glow = true }) => {
  const [failed, setFailed] = useState(false);
  const r = radius ?? Math.round(size * 0.28);
  const shadow = glow ? '0 0 16px var(--accent-glow)' : 'none';

  // Fallback: the original droplet emblem in the accent square.
  if (failed) {
    return (
      <div style={{
        width: size, height: size, background: 'var(--accent-primary)',
        borderRadius: r, display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: shadow, flexShrink: 0,
      }}>
        <Droplets size={Math.round(size * 0.5)} color="var(--text-on-accent)" strokeWidth={2.5} />
      </div>
    );
  }

  return (
    <div style={{
      width: size, height: size, background: '#fff',
      borderRadius: r, display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: shadow, overflow: 'hidden', flexShrink: 0,
    }}>
      <img
        src="/logo.png"
        alt="AgroSense"
        width={size}
        height={size}
        onError={() => setFailed(true)}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  );
};

export default Logo;
