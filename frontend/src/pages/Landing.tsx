import React from 'react';
import { Droplets, Thermometer, Bot, BarChart2, Waves, Gauge, ArrowRight, Wifi } from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';
import Logo from '../components/Logo';

interface Props {
  onGetStarted: () => void;
  onLogin: () => void;
}

const features = [
  {
    icon: <Thermometer size={22} />,
    color: '#ff7c5e',
    title: 'Live Sensor Monitoring',
    desc: 'Real-time temperature, humidity, and soil-moisture readings streamed straight from your field sensors.',
  },
  {
    icon: <Bot size={22} />,
    color: '#5dea8a',
    title: 'AI Farm Advisor',
    desc: 'Crop-aware guidance that reads your live sensors and farm profile to tell you what to do next — no guesswork.',
  },
  {
    icon: <Droplets size={22} />,
    color: '#5bbfef',
    title: 'Automatic Watering',
    desc: 'The pump runs itself from live soil moisture — watering when the ground dries out and stopping once it recovers.',
  },
  {
    icon: <BarChart2 size={22} />,
    color: '#f5a623',
    title: 'Trend Charts',
    desc: 'Live trend charts for every sensor, so you can spot patterns and act before they become problems.',
  },
  {
    icon: <Waves size={22} />,
    color: '#c084fc',
    title: 'Reservoir Tracking',
    desc: 'Watch your water level and pump state in real time, with a live reservoir gauge, so you are never caught with an empty tank.',
  },
  {
    icon: <Gauge size={22} />,
    color: '#fb7185',
    title: 'Status at a Glance',
    desc: 'Every reading is scored against healthy ranges, so warning and critical conditions stand out the moment they appear.',
  },
];

const stats = [
  { value: '8+', label: 'Crop profiles' },
  { value: 'Live', label: 'Sensor readings' },
  { value: '24/7', label: 'Automatic watering' },
  { value: 'AI', label: 'Built-in advisor' },
];

// Body copy color — a readable dark green-gray that sits comfortably on the
// white surfaces throughout the page.
const BODY = '#3f5a49';

const Landing: React.FC<Props> = ({ onGetStarted, onLogin }) => {
  const isMobile = useIsMobile();
  const padX = isMobile ? '20px' : '48px';
  const sectionGap = isMobile ? '56px' : '80px';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', overflowY: 'auto' }}>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '13px 20px' : '16px 48px',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Logo size={32} radius={9} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '17px', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            AgroSense
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={onLogin} style={{
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '8px 18px',
            fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent-primary)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
          >
            Sign In
          </button>
          {!isMobile && (
            <button onClick={onGetStarted} style={{
              background: 'var(--accent-primary)', border: 'none',
              borderRadius: 'var(--radius-sm)', padding: '8px 18px',
              fontSize: '14px', fontWeight: 700, color: 'var(--text-on-accent)',
              cursor: 'pointer', transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.88'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
            >
              Get Started
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        padding: isMobile ? '72px 20px 56px' : '116px 48px 92px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Real-world hero photo — a farmer checking the field. Drop the image at
            frontend/public/hero-farm.jpg. A soft white veil (painted on top of the
            photo) keeps the page white-dominant and the dark copy readable, while
            the farmer stays gently visible underneath. If the file is ever missing
            the veil alone still fades cleanly into the page. */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'linear-gradient(180deg, rgba(245,249,246,0.74) 0%, rgba(245,249,246,0.84) 55%, var(--bg-base) 100%), url(/hero-farm.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
          pointerEvents: 'none',
        }} />

        {/* Glow orb */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', maxWidth: '95vw', height: '300px',
          background: 'radial-gradient(ellipse, rgba(93,234,138,0.10) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 1,
        }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
        <div className="fade-up" style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          background: 'var(--accent-muted)', border: '1px solid rgba(93,234,138,0.2)',
          borderRadius: '20px', padding: '6px 15px',
          fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 700,
          letterSpacing: '0.4px', textTransform: 'uppercase',
          marginBottom: '28px',
        }}>
          <Wifi size={11} />
          IoT-Powered Smart Irrigation
        </div>

        <h1 className="fade-up" style={{
          fontFamily: 'var(--font-display)',
          fontSize: isMobile ? '36px' : '64px', fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: isMobile ? '-1px' : '-2px', lineHeight: 1.08,
          marginBottom: '22px',
          animationDelay: '60ms',
          maxWidth: '800px', margin: '0 auto 22px',
        }}>
          Farm <span className="serif-accent" style={{ color: 'var(--accent-primary)' }}>smarter.</span><br />
          Water <span className="serif-accent" style={{ color: 'var(--accent-primary)' }}>less.</span><br />
          Grow <span className="serif-accent" style={{ color: 'var(--accent-primary)' }}>more.</span>
        </h1>

        <p className="fade-up" style={{
          fontSize: isMobile ? '16px' : '19px', color: BODY,
          lineHeight: 1.7, maxWidth: '560px',
          margin: '0 auto 36px',
          animationDelay: '120ms',
        }}>
          AgroSense connects directly to your field sensors and uses AI to tell you exactly when and how much to water — so you never over- or under-water again.
        </p>

        <div className="fade-up" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', justifyContent: 'center', animationDelay: '180ms' }}>
          <button onClick={onGetStarted} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            background: 'var(--accent-primary)', border: 'none',
            borderRadius: 'var(--radius-md)', padding: '14px 28px',
            fontSize: '15px', fontWeight: 700, color: 'var(--text-on-accent)',
            cursor: 'pointer', transition: 'all 0.15s',
            boxShadow: '0 0 24px var(--accent-glow)',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
          >
            Set Up Your Farm <ArrowRight size={16} />
          </button>
          <button onClick={onLogin} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '14px 28px',
            fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-primary)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
          >
            Sign In
          </button>
        </div>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{
        margin: `0 ${padX}`,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)', padding: isMobile ? '26px 20px' : '28px 48px',
        display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? '20px 16px' : '24px', textAlign: 'center',
        marginBottom: sectionGap,
      }}>
        {stats.map(s => (
          <div key={s.label}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '30px' : '38px', fontWeight: 700, color: 'var(--accent-primary)', letterSpacing: '-1px', marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '13px', color: BODY, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section style={{ padding: `0 ${padX} ${sectionGap}` }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '32px' : '48px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '27px' : '38px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-1px', marginBottom: '12px' }}>
            Everything your farm <span className="serif-accent" style={{ color: 'var(--accent-primary)' }}>needs</span>
          </h2>
          <p style={{ fontSize: isMobile ? '15px' : '16px', color: BODY, maxWidth: '440px', margin: '0 auto', lineHeight: 1.6 }}>
            One device. One dashboard. Full visibility and control over your field conditions.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
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
                width: '44px', height: '44px',
                background: f.color + '15', border: `1px solid ${f.color}30`,
                borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: f.color, marginBottom: '16px',
              }}>
                {f.icon}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '9px' }}>{f.title}</div>
              <div style={{ fontSize: '15px', color: BODY, lineHeight: 1.7 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: `0 ${padX} ${sectionGap}` }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '32px' : '48px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '27px' : '38px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-1px', marginBottom: '12px' }}>
            Up and running in <span className="serif-accent" style={{ color: 'var(--accent-primary)' }}>minutes</span>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '16px', position: 'relative' }}>
          {[
            { title: 'Create Account', desc: 'Sign up with your name, email, and a secure password.' },
            { title: 'Connect Device', desc: 'Enter your AgroSense device Product ID to link your hardware.' },
            { title: 'Set Crop Profile', desc: 'Tell us which crops you grow and their growth stage for tailored advice.' },
            { title: 'Start Monitoring', desc: 'Live dashboard activates instantly. Your AI advisor is ready.' },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '24px',
              position: 'relative',
            }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 700,
                color: 'var(--accent-primary)', opacity: 0.15,
                position: 'absolute', top: '12px', right: '16px',
                lineHeight: 1, letterSpacing: '-2px',
              }}>{String(i + 1).padStart(2, '0')}</div>
              <div style={{
                width: '30px', height: '30px',
                background: 'var(--accent-muted)', border: '1px solid rgba(93,234,138,0.2)',
                borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 700, color: 'var(--accent-primary)',
                marginBottom: '16px',
              }}>{i + 1}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{s.title}</div>
              <div style={{ fontSize: '14px', color: BODY, lineHeight: 1.65 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: `0 ${padX} ${sectionGap}` }}>
        <div style={{
          background: 'linear-gradient(135deg, #e9faf0 0%, #ffffff 62%)',
          border: '1px solid var(--accent-glow)',
          borderRadius: 'var(--radius-xl)', padding: isMobile ? '40px 22px' : '60px',
          textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-50px', left: '50%', transform: 'translateX(-50%)',
            width: '400px', maxWidth: '90%', height: '200px',
            background: 'radial-gradient(ellipse, rgba(93,234,138,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '27px' : '40px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-1.5px', marginBottom: '16px' }}>
            Ready to grow <span className="serif-accent" style={{ color: 'var(--accent-primary)' }}>smarter?</span>
          </h2>
          <p style={{ fontSize: isMobile ? '15px' : '16px', color: BODY, marginBottom: '30px', lineHeight: 1.6 }}>
            Set up your farm in minutes and connect your AgroSense device.
          </p>
          <button onClick={onGetStarted} style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'var(--accent-primary)', border: 'none',
            borderRadius: 'var(--radius-md)', padding: '14px 32px',
            fontSize: '15px', fontWeight: 700, color: 'var(--text-on-accent)',
            cursor: 'pointer', boxShadow: '0 0 32px var(--accent-glow)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
          >
            Get Started <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: `22px ${padX}`, borderTop: '1px solid var(--border)',
        display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '12px' : '0',
        justifyContent: 'space-between', alignItems: 'center', textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Logo size={24} radius={6} glow={false} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>AgroSense</span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          © 2026 AgroSense · Smart Irrigation System
        </div>
      </footer>
    </div>
  );
};

export default Landing;
