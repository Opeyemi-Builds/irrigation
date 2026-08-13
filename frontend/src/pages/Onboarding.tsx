import React, { useState } from 'react';
import {
  Droplets, ArrowRight, ArrowLeft, Check,
  Eye, EyeOff, Cpu, Leaf, ChevronDown
} from 'lucide-react';

interface Props {
  onComplete: () => void;
  onBack: () => void;
}

const VALID_PRODUCT_ID = '12345';

const CROPS = [
  { value: 'maize', label: 'Maize (Corn)', emoji: '🌽' },
  { value: 'tomato', label: 'Tomato', emoji: '🍅' },
  { value: 'cassava', label: 'Cassava', emoji: '🌿' },
  { value: 'pepper', label: 'Pepper', emoji: '🌶️' },
  { value: 'rice', label: 'Rice', emoji: '🌾' },
  { value: 'yam', label: 'Yam', emoji: '🥔' },
  { value: 'plantain', label: 'Plantain', emoji: '🍌' },
  { value: 'soybean', label: 'Soybean', emoji: '🫘' },
];

const GROWTH_STAGES = [
  { value: 'seedling', label: 'Seedling', desc: '0–2 weeks after planting' },
  { value: 'vegetative', label: 'Vegetative', desc: 'Active leaf & stem growth' },
  { value: 'flowering', label: 'Flowering / Fruiting', desc: 'Critical water period' },
  { value: 'maturity', label: 'Maturity / Harvest', desc: 'Approaching harvest' },
];

const SOIL_TYPES = [
  { value: 'loamy', label: 'Loamy', desc: 'Balanced drainage & retention' },
  { value: 'sandy', label: 'Sandy', desc: 'Fast-draining, needs more water' },
  { value: 'clay', label: 'Clay', desc: 'Slow drainage, retains moisture' },
  { value: 'silty', label: 'Silty', desc: 'Good retention, moderate drainage' },
];

type Step = 'account' | 'device' | 'crop' | 'done';

const stepOrder: Step[] = ['account', 'device', 'crop', 'done'];

const StepIndicator: React.FC<{ current: Step }> = ({ current }) => {
  const steps = [
    { key: 'account', label: 'Account' },
    { key: 'device', label: 'Device' },
    { key: 'crop', label: 'Crop Profile' },
  ];
  const currentIdx = stepOrder.indexOf(current);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '40px', justifyContent: 'center' }}>
      {steps.map((s, i) => {
        const done = currentIdx > i;
        const active = currentIdx === i;
        return (
          <React.Fragment key={s.key}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: done ? 'var(--accent-primary)' : active ? 'var(--accent-muted)' : 'var(--bg-elevated)',
                border: `2px solid ${done ? 'var(--accent-primary)' : active ? 'var(--accent-primary)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s',
              }}>
                {done
                  ? <Check size={14} color="var(--text-on-accent)" strokeWidth={3} />
                  : <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 700, color: active ? 'var(--accent-primary)' : 'var(--text-muted)' }}>{i + 1}</span>
                }
              </div>
              <span style={{ fontSize: '10px', fontWeight: active ? 600 : 400, color: active ? 'var(--accent-primary)' : done ? 'var(--text-secondary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: '80px', height: '2px', marginBottom: '18px',
                background: done ? 'var(--accent-primary)' : 'var(--border)',
                transition: 'background 0.3s',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
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
  boxSizing: 'border-box' as const,
});

// ── Step 1: Account ──────────────────────────────────────────────────────────
const AccountStep: React.FC<{ onNext: (data: { name: string; email: string }) => void }> = ({ onNext }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) { setError('Please fill in all fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError(''); setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    onNext({ name, email });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Full Name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="John Adeyemi"
          style={inputStyle(focused === 'name')} onFocus={() => setFocused('name')} onBlur={() => setFocused('')} />
      </div>
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Email Address</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com"
          style={inputStyle(focused === 'email')} onFocus={() => setFocused('email')} onBlur={() => setFocused('')} />
      </div>
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Password</label>
        <div style={{ position: 'relative' }}>
          <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters"
            style={{ ...inputStyle(focused === 'pass'), paddingRight: '42px' }} onFocus={() => setFocused('pass')} onBlur={() => setFocused('')}
            onKeyDown={e => e.key === 'Enter' && submit()} />
          <button onClick={() => setShow(!show)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>
      {error && <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: '12px', color: '#f87171' }}>{error}</div>}
      <button onClick={submit} disabled={loading} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        background: loading ? 'var(--bg-elevated)' : 'var(--accent-primary)',
        border: 'none', borderRadius: 'var(--radius-sm)', padding: '12px',
        fontSize: '14px', fontWeight: 700, color: loading ? 'var(--text-muted)' : 'var(--text-on-accent)',
        cursor: loading ? 'not-allowed' : 'pointer', marginTop: '4px',
      }}>
        {loading ? 'Creating account...' : <><span>Continue</span><ArrowRight size={14} /></>}
      </button>
    </div>
  );
};

// ── Step 2: Device ───────────────────────────────────────────────────────────
const DeviceStep: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
  const [productId, setProductId] = useState('');
  const [farmName, setFarmName] = useState('');
  const [focused, setFocused] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');

  const verify = async () => {
    if (!productId.trim() || !farmName.trim()) return;
    setStatus('verifying');
    await new Promise(r => setTimeout(r, 1400));
    if (productId.trim() === VALID_PRODUCT_ID) {
      setStatus('success');
      await new Promise(r => setTimeout(r, 700));
      onNext();
    } else {
      setStatus('error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        background: 'var(--accent-muted)', border: '1px solid rgba(93,234,138,0.15)',
        borderRadius: 'var(--radius-sm)', padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <Cpu size={14} color="var(--accent-primary)" />
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Find your Product ID on the sticker on the back of your AgroSense device.
        </span>
      </div>

      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Farm Name</label>
        <input value={farmName} onChange={e => setFarmName(e.target.value)} placeholder="e.g. North Field Farm"
          style={inputStyle(focused === 'farm')} onFocus={() => setFocused('farm')} onBlur={() => setFocused('')} />
      </div>

      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Product ID</label>
        <input
          value={productId}
          onChange={e => { setProductId(e.target.value); setStatus('idle'); }}
          placeholder="Enter your device Product ID"
          style={{
            ...inputStyle(focused === 'pid'),
            borderColor: status === 'success' ? 'var(--accent-primary)' : status === 'error' ? '#f87171' : focused === 'pid' ? 'var(--accent-primary)' : 'var(--border)',
            fontFamily: 'var(--font-display)', letterSpacing: '2px', fontSize: '18px',
          }}
          onFocus={() => setFocused('pid')}
          onBlur={() => setFocused('')}
          onKeyDown={e => e.key === 'Enter' && verify()}
        />
        {status === 'error' && (
          <p style={{ fontSize: '11px', color: '#f87171', marginTop: '5px' }}>
            Product ID not recognised. Please check and try again. (Hint: try <strong>12345</strong>)
          </p>
        )}
        {status === 'success' && (
          <p style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Check size={11} strokeWidth={3} /> Device verified successfully
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'transparent', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '11px 16px',
          fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer',
        }}>
          <ArrowLeft size={13} /> Back
        </button>
        <button onClick={verify} disabled={status === 'verifying' || !productId.trim() || !farmName.trim()} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          background: status === 'verifying' || !productId.trim() || !farmName.trim() ? 'var(--bg-elevated)' : 'var(--accent-primary)',
          border: 'none', borderRadius: 'var(--radius-sm)', padding: '12px',
          fontSize: '14px', fontWeight: 700,
          color: status === 'verifying' || !productId.trim() || !farmName.trim() ? 'var(--text-muted)' : 'var(--text-on-accent)',
          cursor: status === 'verifying' ? 'not-allowed' : 'pointer',
        }}>
          {status === 'verifying' ? 'Verifying...' : <><span>Verify Device</span><ArrowRight size={14} /></>}
        </button>
      </div>
    </div>
  );
};

// ── Step 3: Crop ─────────────────────────────────────────────────────────────
const CropStep: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
  const [crop, setCrop] = useState('');
  const [stage, setStage] = useState('');
  const [soil, setSoil] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = crop && stage && soil;

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    onNext();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Crop selector */}
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
          <Leaf size={11} style={{ display: 'inline', marginRight: '5px' }} />
          What are you growing?
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {CROPS.map(c => (
            <button key={c.value} onClick={() => setCrop(c.value)} style={{
              background: crop === c.value ? 'var(--accent-muted)' : 'var(--bg-surface)',
              border: `1px solid ${crop === c.value ? 'rgba(93,234,138,0.3)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)', padding: '10px 8px',
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            }}>
              <span style={{ fontSize: '20px' }}>{c.emoji}</span>
              <span style={{ fontSize: '10px', fontWeight: crop === c.value ? 600 : 400, color: crop === c.value ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                {c.label.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Growth stage */}
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Growth Stage</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {GROWTH_STAGES.map(s => (
            <button key={s.value} onClick={() => setStage(s.value)} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: stage === s.value ? 'var(--accent-muted)' : 'var(--bg-surface)',
              border: `1px solid ${stage === s.value ? 'rgba(93,234,138,0.3)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)', padding: '10px 14px',
              cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
            }}>
              <div style={{
                width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${stage === s.value ? 'var(--accent-primary)' : 'var(--border)'}`,
                background: stage === s.value ? 'var(--accent-primary)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {stage === s.value && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-on-accent)' }} />}
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: stage === s.value ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{s.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Soil type */}
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Soil Type</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {SOIL_TYPES.map(s => (
            <button key={s.value} onClick={() => setSoil(s.value)} style={{
              background: soil === s.value ? 'var(--accent-muted)' : 'var(--bg-surface)',
              border: `1px solid ${soil === s.value ? 'rgba(93,234,138,0.3)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)', padding: '10px 12px',
              cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: soil === s.value ? 'var(--accent-primary)' : 'var(--text-primary)', marginBottom: '2px' }}>{s.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'transparent', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '11px 16px',
          fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer',
        }}>
          <ArrowLeft size={13} /> Back
        </button>
        <button onClick={submit} disabled={!canSubmit || loading} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          background: !canSubmit || loading ? 'var(--bg-elevated)' : 'var(--accent-primary)',
          border: 'none', borderRadius: 'var(--radius-sm)', padding: '12px',
          fontSize: '14px', fontWeight: 700,
          color: !canSubmit || loading ? 'var(--text-muted)' : 'var(--text-on-accent)',
          cursor: !canSubmit || loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? 'Setting up your farm...' : <><span>Launch Dashboard</span><ArrowRight size={14} /></>}
        </button>
      </div>
    </div>
  );
};

// ── Main Onboarding ──────────────────────────────────────────────────────────
const Onboarding: React.FC<Props> = ({ onComplete, onBack }) => {
  const [step, setStep] = useState<Step>('account');

  const titles: Record<Step, { title: string; sub: string }> = {
    account: { title: 'Create your account', sub: 'Join AgroSense and start farming smarter.' },
    device: { title: 'Connect your device', sub: 'Link your AgroSense hardware to this farm.' },
    crop: { title: 'Set your crop profile', sub: 'Help the AI give you crop-specific advice.' },
    done: { title: '', sub: '' },
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative',
    }}>
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: '500px', height: '300px',
        background: 'radial-gradient(ellipse, rgba(93,234,138,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Back to landing */}
      {step === 'account' && (
        <button onClick={onBack} style={{
          position: 'absolute', top: '24px', left: '24px',
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'transparent', border: 'none',
          fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
        >
          <ArrowLeft size={14} /> Back
        </button>
      )}

      <div className="fade-up" style={{
        width: '100%', maxWidth: '480px',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)', padding: '40px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--accent-primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px var(--accent-glow)' }}>
              <Droplets size={17} color="var(--text-on-accent)" strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '17px', color: 'var(--text-primary)' }}>AgroSense</span>
          </div>
        </div>

        <StepIndicator current={step} />

        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px', marginBottom: '6px' }}>
            {titles[step].title}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{titles[step].sub}</p>
        </div>

        {step === 'account' && <AccountStep onNext={() => setStep('device')} />}
        {step === 'device' && <DeviceStep onNext={() => setStep('crop')} onBack={() => setStep('account')} />}
        {step === 'crop' && <CropStep onNext={onComplete} onBack={() => setStep('device')} />}
      </div>
    </div>
  );
};

export default Onboarding;
