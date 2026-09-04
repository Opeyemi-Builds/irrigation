import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import Mascot from './Mascot';

export interface TourStep {
  /** CSS selector (usually a [data-tour="…"]) to spotlight. Omit for a centred card. */
  selector?: string;
  title: string;
  body: string;
  /** Show the mascot in the card — used for the welcome / finish cards. */
  mascot?: boolean;
}

interface Props {
  steps: TourStep[];
  /** Start the tour when this becomes true (and it hasn't been seen before). */
  run: boolean;
  storageKey?: string;
  onClose?: () => void;
}

interface Box { top: number; left: number; width: number; height: number; }

const PAD = 8;
const CARD_W = 340;

const hasSeen = (key?: string) => {
  if (!key) return false;
  try { return localStorage.getItem(key) === '1'; } catch { return false; }
};
const markSeen = (key?: string) => {
  if (!key) return;
  try { localStorage.setItem(key, '1'); } catch { /* private mode — just show it again */ }
};

// A target counts only if it's actually rendered and on-screen (skips the
// off-canvas mobile drawer, display:none nodes, etc.).
const isVisible = (el: Element | null): el is HTMLElement => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  if (r.width < 4 || r.height < 4) return false;
  if (r.right < 40 || r.left > window.innerWidth - 40) return false;
  return true;
};

const Tour: React.FC<Props> = ({ steps, run, storageKey, onClose }) => {
  const [active, setActive] = useState(false);
  const [idx, setIdx] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | 'center' | null>(null);
  const [tick, setTick] = useState(0); // bumped on scroll/resize/after-scroll to re-measure
  const cardRef = useRef<HTMLDivElement>(null);

  const finish = useCallback(() => {
    markSeen(storageKey);
    setActive(false);
    onClose?.();
  }, [storageKey, onClose]);

  // Nearest step (in the given direction) whose target is present & visible.
  const nextValid = useCallback((from: number, dir: 1 | -1): number => {
    for (let i = from; i >= 0 && i < steps.length; i += dir) {
      const s = steps[i];
      if (!s.selector) return i;
      if (isVisible(document.querySelector(s.selector))) return i;
    }
    return -1;
  }, [steps]);

  const goNext = useCallback(() => {
    const n = nextValid(idx + 1, 1);
    if (n === -1) finish(); else setIdx(n);
  }, [idx, nextValid, finish]);

  const goPrev = useCallback(() => {
    const p = nextValid(idx - 1, -1);
    if (p !== -1) setIdx(p);
  }, [idx, nextValid]);

  const isLast = active && nextValid(idx + 1, 1) === -1;
  const hasPrev = active && nextValid(idx - 1, -1) !== -1;

  // Kick off once, shortly after the host view has settled.
  useEffect(() => {
    if (!run || hasSeen(storageKey)) return;
    const t = setTimeout(() => { setIdx(0); setActive(true); }, 650);
    return () => clearTimeout(t);
  }, [run, storageKey]);

  // Bring a selector step into view, then re-measure once it's settled.
  useEffect(() => {
    if (!active) return;
    const step = steps[idx];
    if (!step?.selector) return;
    const el = document.querySelector(step.selector);
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const t = setTimeout(() => setTick(x => x + 1), 360);
    return () => clearTimeout(t);
  }, [active, idx, steps]);

  // Keep the spotlight glued to its target through scroll / resize.
  useEffect(() => {
    if (!active) return;
    const onMove = () => setTick(x => x + 1);
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [active]);

  // Measure + position, synchronously before paint so there's no flash.
  useLayoutEffect(() => {
    if (!active) return;
    const step = steps[idx];
    if (!step) return;

    if (!step.selector) { setBox(null); setPos('center'); return; }

    const el = document.querySelector(step.selector);
    if (!isVisible(el)) {
      const n = nextValid(idx + 1, 1);
      if (n === -1) finish(); else if (n !== idx) setIdx(n);
      return;
    }

    const r = (el as HTMLElement).getBoundingClientRect();
    const b: Box = { top: r.top - PAD, left: r.left - PAD, width: r.width + 2 * PAD, height: r.height + 2 * PAD };
    const cardH = cardRef.current?.offsetHeight ?? 196;
    const cardW = Math.min(CARD_W, window.innerWidth - 24);
    const below = b.top + b.height + 14 + cardH <= window.innerHeight - 12;
    let top = below ? b.top + b.height + 14 : b.top - cardH - 14;
    top = Math.max(12, Math.min(top, window.innerHeight - cardH - 12));
    let left = b.left + b.width / 2 - cardW / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - cardW - 12));
    setBox(b);
    setPos({ top, left });
  }, [active, idx, tick, steps, nextValid, finish]);

  // Keyboard controls.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, finish, goNext, goPrev]);

  if (!active) return null;
  const step = steps[idx];
  if (!step) return null;

  const centered = pos === 'center' || box == null;
  const cardW = Math.min(CARD_W, typeof window !== 'undefined' ? window.innerWidth - 24 : CARD_W);

  const cardStyle: React.CSSProperties = centered
    ? { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: cardW, zIndex: 10002 }
    : { position: 'fixed', top: (pos as { top: number; left: number }).top, left: (pos as { top: number; left: number }).left, width: cardW, zIndex: 10002 };

  return (
    <>
      {/* Click-catcher. For centred cards it also supplies the dim; spotlight
          cards get their dim from the ring's huge box-shadow instead. */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: centered ? 'rgba(6,11,8,0.72)' : 'transparent' }} />

      {/* Spotlight ring */}
      {!centered && box && (
        <div style={{
          position: 'fixed', top: box.top, left: box.left, width: box.width, height: box.height,
          borderRadius: '14px', zIndex: 10001, pointerEvents: 'none',
          animation: 'tour-ring 2.4s ease-in-out infinite',
        }} />
      )}

      {/* Card */}
      <div ref={cardRef} role="dialog" aria-modal="true" style={{
        ...cardStyle,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-elevated)',
        padding: '18px 18px 16px', animation: 'tour-in 0.28s ease both',
      }}>
        {/* Top row: progress dots + skip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            {steps.map((_, i) => (
              <span key={i} style={{
                width: i === idx ? '18px' : '6px', height: '6px', borderRadius: '3px',
                background: i <= idx ? 'var(--accent-primary)' : 'var(--border)',
                transition: 'all 0.25s ease',
              }} />
            ))}
          </div>
          <button onClick={finish} aria-label="Skip tour" style={{
            display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none',
            color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer', padding: '2px 4px',
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
          >
            Skip <X size={12} />
          </button>
        </div>

        {step.mascot && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
            <Mascot size={96} wave />
          </div>
        )}

        <div style={{
          fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700,
          color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: '7px',
          textAlign: step.mascot ? 'center' : 'left',
        }}>
          {step.title}
        </div>
        <p style={{
          fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0,
          textAlign: step.mascot ? 'center' : 'left',
        }}>
          {step.body}
        </p>

        {/* Bottom row: back + next */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginTop: '16px' }}>
          {hasPrev ? (
            <button onClick={goPrev} style={{
              display: 'flex', alignItems: 'center', gap: '5px', background: 'transparent',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px',
              fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer',
            }}>
              <ArrowLeft size={13} /> Back
            </button>
          ) : <span />}

          <button onClick={goNext} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--radius-sm)',
            padding: '8px 16px', fontSize: '13px', fontWeight: 700, color: 'var(--text-on-accent)',
            cursor: 'pointer', boxShadow: '0 0 18px var(--accent-glow)',
          }}>
            {isLast ? <>Get started <Check size={14} /></> : <>Next <ArrowRight size={14} /></>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Tour;
