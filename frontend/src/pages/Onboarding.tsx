import React, { useState } from 'react';
import {
  ArrowRight, ArrowLeft, Check, Plus, X,
  Eye, EyeOff, Cpu, Leaf, Sprout, Loader2
} from 'lucide-react';
import { CROPS, GROWTH_STAGES, SOIL_TYPES, saveFarmProfile, upsertCloudProfile, cropLabel } from '../lib/farm';
import { signUp } from '../lib/auth';
import { useIsMobile } from '../hooks/useIsMobile';
import OnboardingAvatar from '../components/OnboardingAvatar';

interface Props {
  onComplete: () => void;
  onBack: () => void;
}

type Step = 'account' | 'device' | 'crop' | 'done';
const stepOrder: Step[] = ['account', 'device', 'crop', 'done'];

const StepIndicator: React.FC<{ current: Step }> = ({ current }) => {
  const isMobile = useIsMobile();
  const steps = [
    { key: 'account', label: 'Account' },
    { key: 'device', label: 'Device' },
    { key: 'crop', label: 'Crop Profile' },
  ];
  const currentIdx = stepOrder.indexOf(current);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: isMobile ? '26px' : '36px', justifyContent: 'center' }}>
      {steps.map((s, i) => {
        const done = currentIdx > i;
        const active = currentIdx === i;
        return (
          <React.Fragment key={s.key}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: done ? 'var(--accent-primary)' : active ? 'var(--accent-muted)' : 'var(--bg-elevated)',
                border: `2px solid ${done || active ? 'var(--accent-primary)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s',
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
              <div style={{ width: isMobile ? '40px' : '72px', height: '2px', marginBottom: '18px', background: done ? 'var(--accent-primary)' : 'var(--border)', transition: 'background 0.3s' }} />
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

const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' };

const ErrorNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ background: 'var(--red-muted)', border: '1px solid var(--red)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: '12px', color: 'var(--red)' }}>
    {children}
  </div>
);

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
    if (loading) return;
    if (!name.trim() || !email.trim() || !password.trim()) { setError('Please fill in all fields.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError('');
    setLoading(true);
    const res = await signUp(name, email, password);
    setLoading(false);
    if (!res.ok) { setError(res.error); return; }
    onNext({ name: name.trim(), email: email.trim() });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={labelStyle}>Full Name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
          style={inputStyle(focused === 'name')} onFocus={() => setFocused('name')} onBlur={() => setFocused('')} />
      </div>
      <div>
        <label style={labelStyle}>Email Address</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
          style={inputStyle(focused === 'email')} onFocus={() => setFocused('email')} onBlur={() => setFocused('')} />
      </div>
      <div>
        <label style={labelStyle}>Password</label>
        <div style={{ position: 'relative' }}>
          <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters"
            style={{ ...inputStyle(focused === 'pass'), paddingRight: '42px' }} onFocus={() => setFocused('pass')} onBlur={() => setFocused('')}
            onKeyDown={e => e.key === 'Enter' && submit()} />
          <button onClick={() => setShow(!show)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}
      <button onClick={submit} disabled={loading} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '13px',
        fontSize: '14px', fontWeight: 700, color: 'var(--text-on-accent)', cursor: loading ? 'default' : 'pointer',
        opacity: loading ? 0.7 : 1, marginTop: '4px',
      }}>
        {loading
          ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /><span>Creating account…</span></>
          : <><span>Continue</span><ArrowRight size={14} /></>}
      </button>
    </div>
  );
};

// ── Step 2: Device ───────────────────────────────────────────────────────────
const DeviceStep: React.FC<{ onNext: (data: { farmName: string; productId: string }) => void; onBack: () => void }> = ({ onNext, onBack }) => {
  const [productId, setProductId] = useState('');
  const [farmName, setFarmName] = useState('');
  const [focused, setFocused] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if (!farmName.trim()) { setError('Please give your farm a name.'); return; }
    const n = parseInt(productId, 10);
    if (!productId.trim() || Number.isNaN(n) || n < 1 || n > 50) {
      setError('Enter a Product ID between 0001 and 0050.');
      return;
    }
    setError('');
    // Normalise to the printed 4-digit form (e.g. 7 → "0007").
    onNext({ farmName: farmName.trim(), productId: String(n).padStart(4, '0') });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        background: 'var(--accent-muted)', border: '1px solid var(--accent-glow)',
        borderRadius: 'var(--radius-sm)', padding: '12px 14px',
        display: 'flex', alignItems: 'flex-start', gap: '10px',
      }}>
        <Cpu size={14} color="var(--accent-primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Use any Product ID from <strong style={{ color: 'var(--text-primary)' }}>0001</strong> to <strong style={{ color: 'var(--text-primary)' }}>0050</strong>. Each ID is its own farm — perfect for testing with different logins.
        </span>
      </div>

      <div>
        <label style={labelStyle}>Farm Name</label>
        <input value={farmName} onChange={e => setFarmName(e.target.value)} placeholder="e.g. North Field Farm"
          style={inputStyle(focused === 'farm')} onFocus={() => setFocused('farm')} onBlur={() => setFocused('')} />
      </div>

      <div>
        <label style={labelStyle}>Product ID</label>
        <input
          value={productId}
          inputMode="numeric"
          onChange={e => { setProductId(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
          placeholder="e.g. 0007"
          style={{ ...inputStyle(focused === 'pid'), fontFamily: 'var(--font-display)', letterSpacing: '4px', fontSize: '20px', textAlign: 'center' }}
          onFocus={() => setFocused('pid')}
          onBlur={() => setFocused('')}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '11px 16px',
          fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer',
        }}>
          <ArrowLeft size={13} /> Back
        </button>
        <button onClick={submit} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '13px',
          fontSize: '14px', fontWeight: 700, color: 'var(--text-on-accent)', cursor: 'pointer',
        }}>
          <span>Continue</span><ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

// ── Step 3: Crop (multi-select + custom) ─────────────────────────────────────
const CropStep: React.FC<{ onSubmit: (data: { crops: string[]; stage: string; soil: string }) => void; onBack: () => void }> = ({ onSubmit, onBack }) => {
  const isMobile = useIsMobile();
  const [crops, setCrops] = useState<string[]>([]);
  const [customCrop, setCustomCrop] = useState('');
  const [stage, setStage] = useState('');
  const [soil, setSoil] = useState('');
  const [focused, setFocused] = useState(false);

  const toggleCrop = (value: string) =>
    setCrops(prev => (prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]));

  const addCustom = () => {
    const v = customCrop.trim();
    if (!v) return;
    const exists = crops.some(c => c.toLowerCase() === v.toLowerCase()) ||
      CROPS.some(c => c.label.toLowerCase() === v.toLowerCase());
    if (!exists) setCrops(prev => [...prev, v]);
    setCustomCrop('');
  };

  const removeCrop = (value: string) => setCrops(prev => prev.filter(c => c !== value));

  const canSubmit = crops.length > 0 && !!stage && !!soil;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Crop selector */}
      <div>
        <label style={{ ...labelStyle, marginBottom: '8px' }}>
          <Leaf size={11} style={{ display: 'inline', marginRight: '5px' }} />
          What are you growing? <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>· pick one or more</span>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 3 : 4}, 1fr)`, gap: '8px' }}>
          {CROPS.map(c => {
            const selected = crops.includes(c.value);
            return (
              <button key={c.value} onClick={() => toggleCrop(c.value)} style={{
                position: 'relative',
                background: selected ? 'var(--accent-muted)' : 'var(--bg-surface)',
                border: `1px solid ${selected ? 'var(--accent-glow)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)', padding: '12px 8px',
                cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
              }}>
                {selected && (
                  <div style={{ position: 'absolute', top: '5px', right: '5px', width: '15px', height: '15px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={9} color="var(--text-on-accent)" strokeWidth={3.5} />
                  </div>
                )}
                <Sprout size={16} color={selected ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                <span style={{ fontSize: '10px', fontWeight: selected ? 600 : 400, color: selected ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                  {c.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom crop entry */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          <input
            value={customCrop}
            onChange={e => setCustomCrop(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
            placeholder="Type another crop (e.g. Okra, Wheat)…"
            style={{ ...inputStyle(focused), flex: 1 }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          <button onClick={addCustom} disabled={!customCrop.trim()} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: customCrop.trim() ? 'var(--accent-muted)' : 'var(--bg-surface)',
            border: `1px solid ${customCrop.trim() ? 'var(--accent-glow)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-sm)', padding: '0 14px',
            fontSize: '13px', fontWeight: 600,
            color: customCrop.trim() ? 'var(--accent-primary)' : 'var(--text-muted)',
            cursor: customCrop.trim() ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap',
          }}>
            <Plus size={14} /> Add
          </button>
        </div>

        {/* Selected chips */}
        {crops.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
            {crops.map(v => (
              <span key={v} style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'var(--accent-muted)', border: '1px solid var(--accent-glow)',
                borderRadius: '999px', padding: '5px 6px 5px 12px',
                fontSize: '12px', fontWeight: 600, color: 'var(--accent-primary)',
              }}>
                {cropLabel(v)}
                <button onClick={() => removeCrop(v)} aria-label={`Remove ${cropLabel(v)}`} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: 'rgba(0,0,0,0.25)', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', padding: 0,
                }}>
                  <X size={10} strokeWidth={3} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Growth stage */}
      <div>
        <label style={{ ...labelStyle, marginBottom: '8px' }}>Growth Stage</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {GROWTH_STAGES.map(s => {
            const selected = stage === s.value;
            return (
              <button key={s.value} onClick={() => setStage(s.value)} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: selected ? 'var(--accent-muted)' : 'var(--bg-surface)',
                border: `1px solid ${selected ? 'var(--accent-glow)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
              }}>
                <div style={{
                  width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${selected ? 'var(--accent-primary)' : 'var(--border)'}`,
                  background: selected ? 'var(--accent-primary)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {selected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-on-accent)' }} />}
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: selected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{s.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Soil type */}
      <div>
        <label style={{ ...labelStyle, marginBottom: '8px' }}>Soil Type</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {SOIL_TYPES.map(s => {
            const selected = soil === s.value;
            return (
              <button key={s.value} onClick={() => setSoil(s.value)} style={{
                background: selected ? 'var(--accent-muted)' : 'var(--bg-surface)',
                border: `1px solid ${selected ? 'var(--accent-glow)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)', padding: '10px 12px',
                cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
              }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: selected ? 'var(--accent-primary)' : 'var(--text-primary)', marginBottom: '2px' }}>{s.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '11px 16px',
          fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer',
        }}>
          <ArrowLeft size={13} /> Back
        </button>
        <button onClick={() => canSubmit && onSubmit({ crops, stage, soil })} disabled={!canSubmit} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          background: canSubmit ? 'var(--accent-primary)' : 'var(--bg-elevated)',
          border: 'none', borderRadius: 'var(--radius-sm)', padding: '13px',
          fontSize: '14px', fontWeight: 700,
          color: canSubmit ? 'var(--text-on-accent)' : 'var(--text-muted)',
          cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}>
          <span>Launch Dashboard</span><ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

// ── Main Onboarding ──────────────────────────────────────────────────────────
const Onboarding: React.FC<Props> = ({ onComplete, onBack }) => {
  const isMobile = useIsMobile();
  const [step, setStep] = useState<Step>('account');
  const [farmName, setFarmName] = useState('');
  const [productId, setProductId] = useState('');

  const titles: Record<Step, { title: string; sub: string }> = {
    account: { title: 'Create your account', sub: 'Join AgroSense and start farming smarter.' },
    device: { title: 'Connect your device', sub: 'Link your AgroSense hardware to this farm.' },
    crop: { title: 'Set your crop profile', sub: 'Add every crop you grow — the advisor tailors its guidance to each.' },
    done: { title: '', sub: '' },
  };

  const finish = async (data: { crops: string[]; stage: string; soil: string }) => {
    const profile = {
      farmName,
      crop: data.crops[0] ?? '',   // primary crop keeps single-crop consumers working
      crops: data.crops,
      growthStage: data.stage,
      soilType: data.soil,
      productId,
    };
    saveFarmProfile(profile);
    // Share it against the Product ID before entering, so the dashboard's cloud
    // hydration reads back exactly what was just chosen rather than a stale copy.
    await upsertCloudProfile(profile);
    onComplete();
  };

  const avatarStep = step === 'done' ? 'crop' : step;

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center',
      padding: isMobile ? '16px' : '24px', position: 'relative',
    }}>
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: '500px', maxWidth: '90vw', height: '300px',
        background: 'radial-gradient(ellipse, rgba(93,234,138,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {step === 'account' && (
        <button onClick={onBack} style={{
          position: 'absolute', top: '18px', left: '18px', zIndex: 2,
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'transparent', border: 'none', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
        >
          <ArrowLeft size={14} /> Back
        </button>
      )}

      <div className="fade-up" style={{
        width: '100%', maxWidth: isMobile ? '440px' : '860px',
        marginTop: isMobile ? '44px' : 0,
        display: 'flex', flexDirection: isMobile ? 'column' : 'row',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)', overflow: 'hidden',
      }}>
        {/* Avatar / brand panel */}
        <div style={{
          flex: isMobile ? 'none' : '0 0 320px',
          background: 'linear-gradient(160deg, #132019 0%, #0d1a12 100%)',
          borderRight: isMobile ? 'none' : '1px solid var(--border)',
          borderBottom: isMobile ? '1px solid var(--border)' : 'none',
          padding: isMobile ? '24px' : '40px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <OnboardingAvatar step={avatarStep} compact={isMobile} />
        </div>

        {/* Form panel */}
        <div style={{ flex: 1, padding: isMobile ? '24px' : '40px', minWidth: 0 }}>
          <StepIndicator current={step} />

          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px', marginBottom: '6px' }}>
              {titles[step].title}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{titles[step].sub}</p>
          </div>

          {step === 'account' && <AccountStep onNext={() => setStep('device')} />}
          {step === 'device' && (
            <DeviceStep
              onNext={data => { setFarmName(data.farmName); setProductId(data.productId); setStep('crop'); }}
              onBack={() => setStep('account')}
            />
          )}
          {step === 'crop' && <CropStep onSubmit={finish} onBack={() => setStep('device')} />}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
