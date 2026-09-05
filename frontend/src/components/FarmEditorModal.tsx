import React, { useEffect, useState } from 'react';
import { X, Plus, Check, Leaf, Home } from 'lucide-react';
import {
  CROPS, cropLabel, cropEmoji,
  getFarmProfile, updateFarmCrops, updateFarmName,
} from '../lib/farm';
import { useIsMobile } from '../hooks/useIsMobile';

// Interactive "your farm" editor. Opened by tapping the farm in Irrigation → Zones.
// Farmers name their farm and pick every crop they grow from a fun, tappable grid
// (or add their own). Every change autosaves locally + to the cloud via the farm
// helpers, and `onChange` lets the host page refresh its zone titles / chips.
interface Props {
  open: boolean;
  onClose: () => void;
  onChange?: () => void;
}

const FarmEditorModal: React.FC<Props> = ({ open, onClose, onChange }) => {
  const isMobile = useIsMobile();
  const profile = getFarmProfile();
  const [name, setName] = useState(profile?.farmName ?? '');
  const [crops, setCrops] = useState<string[]>(profile?.crops ?? []);
  const [customCrop, setCustomCrop] = useState('');

  // Re-sync from the saved profile every time the modal opens, so it always shows
  // the latest state rather than a stale first-mount snapshot.
  useEffect(() => {
    if (open) {
      const p = getFarmProfile();
      setName(p?.farmName ?? '');
      setCrops(p?.crops ?? []);
      setCustomCrop('');
    }
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !profile) return null;

  // Persist the crop list — optimistic local update, then save + cloud sync.
  const commitCrops = async (next: string[]) => {
    setCrops(next);
    await updateFarmCrops(next);
    onChange?.();
  };

  const toggleCrop = (value: string) =>
    commitCrops(crops.includes(value) ? crops.filter(c => c !== value) : [...crops, value]);

  const addCustom = () => {
    const v = customCrop.trim();
    setCustomCrop('');
    if (!v) return;
    // If they typed a catalogue crop by name, use its canonical value.
    const cat = CROPS.find(c => c.label.toLowerCase() === v.toLowerCase() || c.value.toLowerCase() === v.toLowerCase());
    const toAdd = cat ? cat.value : v;
    if (crops.some(c => c.toLowerCase() === toAdd.toLowerCase())) return;
    commitCrops([...crops, toAdd]);
  };

  const removeCrop = (value: string) => commitCrops(crops.filter(c => c !== value));

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === (profile.farmName ?? '').trim()) return;
    await updateFarmName(trimmed);
    onChange?.();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : '20px', animation: 'fade-in 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: isMobile ? '20px 20px 0 0' : 'var(--radius-lg)',
          width: '100%', maxWidth: '620px', maxHeight: isMobile ? '92vh' : '88vh',
          overflowY: 'auto', boxShadow: '0 24px 70px rgba(16,38,24,0.28)',
          animation: isMobile ? 'slide-up 0.28s cubic-bezier(0.4,0,0.2,1)' : 'pop-in 0.24s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 1,
          background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)',
          padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
            <div style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '12px', background: 'var(--accent-muted)', border: '1px solid var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={19} color="var(--accent-primary)" />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Your Farm</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Name your farm and pick everything you grow</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ width: '32px', height: '32px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Farm name */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            <Home size={12} /> Farm name
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
            placeholder="e.g. Green Valley Farm"
            style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', fontSize: '15px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', marginBottom: '24px' }}
          />

          {/* Crops heading */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              What do you grow?
            </label>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)', background: 'var(--accent-muted)', border: '1px solid var(--accent-glow)', borderRadius: '999px', padding: '2px 10px' }}>
              {crops.length} selected
            </span>
          </div>

          {/* Catalogue grid — tap to add/remove */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 3 : 4}, 1fr)`, gap: '10px', marginBottom: '18px' }}>
            {CROPS.map(c => {
              const selected = crops.includes(c.value);
              return (
                <button
                  key={c.value}
                  onClick={() => toggleCrop(c.value)}
                  style={{
                    position: 'relative', aspectRatio: '1',
                    background: selected ? 'var(--accent-muted)' : 'var(--bg-surface)',
                    border: `1.5px solid ${selected ? 'var(--accent-primary)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '7px',
                    transform: selected ? 'translateY(-2px)' : 'none',
                    boxShadow: selected ? '0 6px 18px var(--accent-glow)' : 'none',
                    transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                  }}
                  onMouseEnter={e => { if (!selected) { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--accent-glow)'; el.style.transform = 'translateY(-2px)'; } }}
                  onMouseLeave={e => { if (!selected) { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.transform = 'none'; } }}
                >
                  {selected && (
                    <div style={{ position: 'absolute', top: '7px', right: '7px', width: '18px', height: '18px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                      <Check size={11} color="var(--text-on-accent)" strokeWidth={3.5} />
                    </div>
                  )}
                  <span style={{ fontSize: '26px', lineHeight: 1 }}>{cropEmoji(c.value)}</span>
                  <span style={{ fontSize: '11px', fontWeight: selected ? 700 : 500, color: selected ? 'var(--accent-primary)' : 'var(--text-secondary)', textAlign: 'center', padding: '0 4px' }}>
                    {c.label.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom crop entry */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <input
              value={customCrop}
              onChange={e => setCustomCrop(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
              placeholder="Add your own crop (e.g. Okra, Wheat)…"
              style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', fontSize: '14px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
            />
            <button onClick={addCustom} disabled={!customCrop.trim()} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: customCrop.trim() ? 'var(--accent-primary)' : 'var(--bg-surface)',
              border: `1px solid ${customCrop.trim() ? 'var(--accent-primary)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)', padding: '0 16px', fontSize: '13px', fontWeight: 700,
              color: customCrop.trim() ? 'var(--text-on-accent)' : 'var(--text-muted)',
              cursor: customCrop.trim() ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap',
            }}>
              <Plus size={15} /> Add
            </button>
          </div>

          {/* Selected crops */}
          {crops.length > 0 ? (
            <>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Your crops — tap × to remove</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {crops.map(v => (
                  <span key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'var(--accent-muted)', border: '1px solid var(--accent-glow)', borderRadius: '999px', padding: '6px 8px 6px 12px', fontSize: '13px', fontWeight: 600, color: 'var(--accent-primary)' }}>
                    <span>{cropEmoji(v)}</span>
                    {cropLabel(v)}
                    <button onClick={() => removeCrop(v)} aria-label={`Remove ${cropLabel(v)}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', background: 'var(--accent-muted)', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', padding: 0 }}>
                      <X size={11} strokeWidth={3} />
                    </button>
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>
              Pick a crop above or add your own to get advice tailored to your field.
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{ position: 'sticky', bottom: 0, background: 'var(--bg-card)', borderTop: '1px solid var(--border-subtle)', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '11px 26px', fontSize: '14px', fontWeight: 700, color: 'var(--text-on-accent)', cursor: 'pointer', boxShadow: '0 4px 14px var(--accent-glow)' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default FarmEditorModal;
