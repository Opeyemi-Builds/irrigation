import React, { useState } from 'react';
import { Leaf, Plus, X, Check, Sprout, Loader2 } from 'lucide-react';
import { CROPS, cropLabel, getFarmProfile, updateFarmCrops } from '../lib/farm';
import { useIsMobile } from '../hooks/useIsMobile';

// Post-onboarding crop editor. The farmer's crop list is captured during
// onboarding but shouldn't be frozen there — farms change what they grow. This
// card lets them add or drop crops any time, saving to localStorage and syncing
// to the cloud (via updateFarmCrops), so the advisor and zones stay accurate.
//
// It mirrors the onboarding CropStep's UX exactly — a catalogue grid, a custom
// crop entry, and removable chips — so it feels familiar. `onChange` lets the
// host page re-read the profile and refresh its own crop-dependent UI.
const CropManager: React.FC<{ onChange?: () => void }> = ({ onChange }) => {
  const isMobile = useIsMobile();
  const profile = getFarmProfile();
  const [crops, setCrops] = useState<string[]>(profile?.crops ?? []);
  const [customCrop, setCustomCrop] = useState('');
  const [focused, setFocused] = useState(false);
  const [saving, setSaving] = useState(false);

  // No farm configured yet (shouldn't happen post-onboarding) — nothing to edit.
  if (!profile) return null;

  // Optimistically show the new list, then persist. updateFarmCrops writes to
  // localStorage synchronously before the (awaited) cloud sync, so the local
  // copy is safe the instant we call it; the await only covers the cloud upsert.
  const commit = async (next: string[]) => {
    setCrops(next);
    setSaving(true);
    await updateFarmCrops(next);
    setSaving(false);
    onChange?.();
  };

  const toggleCrop = (value: string) =>
    commit(crops.includes(value) ? crops.filter(c => c !== value) : [...crops, value]);

  const addCustom = () => {
    const v = customCrop.trim();
    setCustomCrop('');
    if (!v) return;
    // If the typed name is really a catalogue crop, store its value so it gets
    // the rich label + agronomy the advisor uses, not just the raw string.
    const cat = CROPS.find(
      c => c.label.toLowerCase() === v.toLowerCase() || c.value.toLowerCase() === v.toLowerCase(),
    );
    const toAdd = cat ? cat.value : v;
    if (crops.some(c => c.toLowerCase() === toAdd.toLowerCase())) return; // already added
    commit([...crops, toAdd]);
  };

  const removeCrop = (value: string) => commit(crops.filter(c => c !== value));

  const status = saving
    ? 'Saving…'
    : crops.length === 0
      ? 'No crops yet'
      : `${crops.length} crop${crops.length === 1 ? '' : 's'}`;

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '20px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Leaf size={15} color="var(--accent-primary)" />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Your Crops</h3>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, color: saving ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
          {saving && <Loader2 size={11} style={{ animation: 'spin 0.7s linear infinite' }} />}
          {status}
        </span>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
        Add every crop grown on this farm — the advisor tailors its guidance to each one.
      </p>

      {/* Catalogue grid */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 3 : 4}, 1fr)`, gap: '8px' }}>
        {CROPS.map(c => {
          const selected = crops.includes(c.value);
          return (
            <button key={c.value} onClick={() => toggleCrop(c.value)} disabled={saving} style={{
              position: 'relative',
              background: selected ? 'var(--accent-muted)' : 'var(--bg-surface)',
              border: `1px solid ${selected ? 'var(--accent-glow)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)', padding: '12px 8px',
              cursor: saving ? 'default' : 'pointer', transition: 'all 0.15s',
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
          placeholder="Add another crop (e.g. Okra, Wheat)…"
          style={{
            flex: 1, background: 'var(--bg-surface)',
            border: `1px solid ${focused ? 'var(--accent-primary)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-sm)', padding: '11px 14px', fontSize: '14px',
            color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
          }}
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

      {/* Current crops */}
      {crops.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
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
      ) : (
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '14px' }}>
          Pick a crop above, or type your own, to tailor your dashboard.
        </p>
      )}
    </div>
  );
};

export default CropManager;
