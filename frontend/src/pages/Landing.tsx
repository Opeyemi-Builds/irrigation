import React from 'react';
import { Droplets, Thermometer, Leaf, CloudRain, Bot, BarChart2, ArrowRight, Zap, Shield, Wifi } from 'lucide-react';

interface Props {
  onGetStarted: () => void;
  onLogin: () => void;
}

const features = [
  {
    icon: <Thermometer size={20} />,
    color: '#ff7c5e',
    title: 'Live Sensor Monitoring',
    desc: 'Real-time temperature, humidity, and soil moisture data streamed directly from your field sensors.',
  },
  {
    icon: <Bot size={20} />,
    color: '#5dea8a',
    title: 'AI Farm Advisor',
    desc: 'Crop-aware AI that gives you specific, actionable recommendations based on your field conditions and growth stage.',
  },
  {
    icon: <CloudRain size={20} />,
    color: '#5bbfef',
    title: 'Weather-Smart Irrigation',
    desc: 'Automatically holds irrigation when rain is forecast — saving water and protecting your crops.',
  },
  {
    icon: <BarChart2 size={20} />,
    color: '#f5a623',
    title: 'Trend Analytics',
    desc: '24-hour sensor history with visual charts so you can spot patterns before they become problems.',
  },
  {
    icon: <Zap size={20} />,
    color: '#c084fc',
    title: 'Zone Automation',
    desc: 'Set moisture thresholds per zone and let the system irrigate automatically — day or night.',
  },
  {
    icon: <Shield size={20} />,
    color: '#fb7185',
    title: 'Alert System',
    desc: 'Instant alerts when sensor readings go critical so you can act before crops are affected.',
  },
];

const stats = [
  { value: '40%', label: 'Less water used' },
  { value: '<2s', label: 'Sensor update rate' },
  { value: '24/7', label: 'Autonomous monitoring' },
  { value: '4+', label: 'Crop profiles supported' },
];

const Landing: React.FC<Props> = ({ onGetStarted, onLogin }) => {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', overflowY: 'auto' }}>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 48px',
        background: 'rgba(10,15,13,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', background: 'var(--accent-primary)',
            borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px var(--accent-glow)',
          }}>
            <Droplets size={16} color="var(--text-on-accent)" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            AgroSense
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={onLogin} style={{
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '7px 18px',
            fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent-primary)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
          >
            Sign In
          </button>
          <button onClick={onGetStarted} style={{
            background: 'var(--accent-primary)', border: 'none',
            borderRadius: 'var(--radius-sm)', padding: '7px 18px',
            fontSize: '13px', fontWeight: 600, color: 'var(--text-on-accent)',
            cursor: 'pointer', transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.88'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        padding: '100px 48px 80px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Glow orb */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '300px',
          background: 'radial-gradient(ellipse, rgba(93,234,138,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="fade-up" style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          background: 'var(--accent-muted)', border: '1px solid rgba(93,234,138,0.2)',
          borderRadius: '20px', padding: '5px 14px',
          fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600,
          letterSpacing: '0.4px', textTransform: 'uppercase',
          marginBottom: '28px',
        }}>
          <Wifi size={10} />
          IoT-Powered Smart Irrigation
        </div>

        <h1 className="fade-up" style={{
          fontFamily: 'var(--font-display)',
          fontSize: '64px', fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-2px', lineHeight: 1.05,
          marginBottom: '24px',
          animationDelay: '60ms',
          maxWidth: '800px', margin: '0 auto 24px',
        }}>
          Farm smarter.<br />
          <span style={{ color: 'var(--accent-primary)' }}>Water less.</span><br />
          Grow more.
        </h1>

        <p className="fade-up" style={{
          fontSize: '17px', color: 'var(--text-secondary)',
          lineHeight: 1.7, maxWidth: '520px',
          margin: '0 auto 40px',
          animationDelay: '120ms',
        }}>
          AgroSense connects directly to your field sensors and uses AI to tell you exactly when, where, and how much to irrigate — so you never over- or under-water again.
        </p>

        <div className="fade-up" style={{ display: 'flex', gap: '12px', justifyContent: 'center', animationDelay: '180ms' }}>
          <button onClick={onGetStarted} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--accent-primary)', border: 'none',
            borderRadius: 'var(--radius-md)', padding: '12px 28px',
            fontSize: '14px', fontWeight: 700, color: 'var(--text-on-accent)',
            cursor: 'pointer', transition: 'all 0.15s',
            boxShadow: '0 0 24px var(--accent-glow)',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
          >
            Set Up Your Farm <ArrowRight size={15} />
          </button>
          <button onClick={onLogin} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '12px 28px',
            fontSize: '14px', color: 'var(--text-secondary)', cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-primary)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
          >
            Sign In
          </button>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{
        margin: '0 48px',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)', padding: '28px 48px',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '24px', textAlign: 'center',
        marginBottom: '80px',
      }}>
        {stats.map(s => (
          <div key={s.label}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '-1px', marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section style={{ padding: '0 48px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-1px', marginBottom: '12px' }}>
            Everything your farm needs
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
            One device. One dashboard. Full visibility and control over your field conditions.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '24px',
              transition: 'border-color 0.2s, transform 0.2s',
              cursor: 'default',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = f.color + '50'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              <div style={{
                width: '42px', height: '42px',
                background: f.color + '15', border: `1px solid ${f.color}30`,
                borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: f.color, marginBottom: '16px',
              }}>
                {f.icon}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{f.title}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '0 48px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-1px', marginBottom: '12px' }}>
            Up and running in minutes
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', position: 'relative' }}>
          {[
            { step: '01', title: 'Create Account', desc: 'Sign up with your name, email, and a secure password.' },
            { step: '02', title: 'Verify Device', desc: 'Enter your AgroSense device Product ID to link your hardware.' },
            { step: '03', title: 'Set Crop Profile', desc: 'Tell us your crop type and current growth stage for tailored advice.' },
            { step: '04', title: 'Start Monitoring', desc: 'Live dashboard activates instantly. Your AI advisor is ready.' },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '24px',
              position: 'relative',
            }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 800,
                color: 'var(--accent-primary)', opacity: 0.15,
                position: 'absolute', top: '12px', right: '16px',
                lineHeight: 1, letterSpacing: '-2px',
              }}>{s.step}</div>
              <div style={{
                width: '28px', height: '28px',
                background: 'var(--accent-muted)', border: '1px solid rgba(93,234,138,0.2)',
                borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 700, color: 'var(--accent-primary)',
                marginBottom: '16px',
              }}>{i + 1}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{s.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '0 48px 80px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #162019 0%, #0f1a12 100%)',
          border: '1px solid rgba(93,234,138,0.15)',
          borderRadius: 'var(--radius-xl)', padding: '60px',
          textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-50px', left: '50%', transform: 'translateX(-50%)',
            width: '400px', height: '200px',
            background: 'radial-gradient(ellipse, rgba(93,234,138,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-1.5px', marginBottom: '16px' }}>
            Ready to grow smarter?
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Set up your farm in under 5 minutes. Your device is already waiting.
          </p>
          <button onClick={onGetStarted} style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'var(--accent-primary)', border: 'none',
            borderRadius: 'var(--radius-md)', padding: '13px 32px',
            fontSize: '14px', fontWeight: 700, color: 'var(--text-on-accent)',
            cursor: 'pointer', boxShadow: '0 0 32px var(--accent-glow)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
          >
            Get Started Free <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '24px 48px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', background: 'var(--accent-primary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Droplets size={12} color="var(--text-on-accent)" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>AgroSense</span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Smart Irrigation System · Final Year Project
        </div>
      </footer>
    </div>
  );
};

export default Landing;
