import React, { useState } from 'react';
import { Home, Check, Loader2 } from 'lucide-react';
import { getFarmProfile, updateFarmName } from '../lib/farm';
import CropManager from './CropManager';

// Farm management panel for the Irrigation page: rename the farm and edit its crop
// list in one place. The farm name flows into the zone titles and the dashboard
// header; the crops drive the advisor. Both save locally and sync to the cloud.
//
// Laid out as two sibling cards under a shared heading (name editor, then the
// existing CropManager card) to avoid nesting a card inside a card. `onChange`
// lets the host page re-read the profile so its own name/crop-dependent UI
// (zone titles, header chip) refreshes without a reload.
const FarmSettings: React.FC<{ onChange?: () => void }> = ({ onChange }) => {
  const profile = getFarmProfile();
  const [name, setName] = useState(profile?.farmName ?? '');
  const [focused, setFocused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // No farm configured yet (shouldn't happen post-onboarding) — nothing to edit.
  if (!profile) return null;

  const trimmed = name.trim();
  const changed = trimmed.length > 0 && trimmed !== (profile.farmName ?? '').trim();

  const save = async () => {
    if (!changed || saving) return;
    setSaving(true);
    setJustSaved(false);
    await updateFarmName(trimmed);
    setSaving(false);
    setJustSaved(true);
    onChange?.();
    // Clear the "Saved" flash after a moment so it doesn't linger.
    setTimeout(() => setJustSaved(false), 2000);
  };

  return (
    <div>
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Farm settings</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Rename your farm or change the crops you grow — updates apply across your dashboard.
        </p>
      </div>

      {/* Farm name editor */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Home size={15} color="var(--accent-primary)" />
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Farm name</h4>
          </div>
          {saving ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, color: 'var(--accent-primary)' }}>
              <Loader2 size={11} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving…
            </span>
          ) : justSaved ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, color: 'var(--accent-primary)' }}>
              <Check size={12} /> Saved
            </span>
          ) : null}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); save(); } }}
            placeholder="e.g. Green Valley Farm"
            style={{
              flex: 1, background: 'var(--bg-surface)',
              border: `1px solid ${focused ? 'var(--accent-primary)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)', padding: '11px 14px', fontSize: '14px',
              color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          <button onClick={save} disabled={!changed || saving} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: changed ? 'var(--accent-muted)' : 'var(--bg-surface)',
            border: `1px solid ${changed ? 'var(--accent-glow)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-sm)', padding: '0 18px',
            fontSize: '13px', fontWeight: 600,
            color: changed ? 'var(--accent-primary)' : 'var(--text-muted)',
            cursor: changed && !saving ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap',
          }}>
            Save
          </button>
        </div>
      </div>

      {/* Crops on this farm */}
      <CropManager onChange={onChange} />
    </div>
  );
};

export default FarmSettings;
