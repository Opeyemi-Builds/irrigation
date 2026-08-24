import React, { useState } from 'react';
import { Droplets, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';

interface Props {
  onLogin: () => void;
  onBack: () => void;
  onSignUp: () => void;
}

const Login: React.FC<Props> = ({ onLogin, onBack, onSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!email.trim() || !password) { setError('Please fill in all fields.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address.'); return; }
    setError('');
    onLogin();
  };

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width: '100%',
    background: 'var(--bg-surface)',
    border: `1px solid ${focused ? 'var(--accent-primary)' : 'var(--border)'}`,
    borderRadius: 'var(--radius-sm)',
    padding: '11px 14px',
    fontSize: '14px',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  });

  const [focusedField, setFocusedField] = useState('');

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      position: 'relative',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '30%', left: '50%', transform: 'translateX(-50%)',
        width: '500px', height: '300px',
        background: 'radial-gradient(ellipse, rgba(93,234,138,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Back button */}
      <button onClick={onBack} style={{
        position: 'absolute', top: '24px', left: '24px',
        display: 'flex', alignItems: 'center', gap: '6px',
        background: 'transparent', border: 'none',
        fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer',
        transition: 'color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="fade-up" style={{
        width: '100%', maxWidth: '400px',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)', padding: '40px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px', height: '48px', background: 'var(--accent-primary)',
            borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: '0 0 24px var(--accent-glow)',
          }}>
            <Droplets size={22} color="var(--text-on-accent)" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: '6px' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Sign in to your AgroSense account</p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="farmer@example.com"
              style={inputStyle(focusedField === 'email')}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField('')}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ ...inputStyle(focusedField === 'password'), paddingRight: '42px' }}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: 'var(--red-muted)', border: '1px solid var(--red)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: '12px', color: 'var(--red)' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: 'var(--accent-primary)',
              border: 'none', borderRadius: 'var(--radius-sm)',
              padding: '12px', fontSize: '14px', fontWeight: 700,
              color: 'var(--text-on-accent)',
              cursor: 'pointer',
              transition: 'all 0.15s', marginTop: '4px',
            }}
          >
            <span>Sign In</span><ArrowRight size={14} />
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <button onClick={onSignUp} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: 0 }}>
            Create one
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
