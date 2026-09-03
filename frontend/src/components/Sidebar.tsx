import React, { useState } from 'react';
import {
  LayoutDashboard,
  Droplets,
  Thermometer,
  Wind,
  Bot,
  Wifi,
  WifiOff,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useLiveData } from '../hooks/useLiveData';
import { useIsMobile } from '../hooks/useIsMobile';
import Logo from './Logo';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sensors', label: 'Sensors', icon: Thermometer },
  { id: 'irrigation', label: 'Irrigation', icon: Droplets },
  { id: 'weather', label: 'Weather', icon: Wind },
  { id: 'ai-advisor', label: 'AI Advisor', icon: Bot },
];

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, onLogout }) => {
  const live = useLiveData();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const isLive = live.deviceConnected && live.hasData;

  // ── Mobile: top app bar + slide-in drawer ──────────────────────────────────
  if (isMobile) {
    const go = (id: string) => { onNavigate(id); setOpen(false); };

    return (
      <>
        {/* Top app bar */}
        <header style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 45,
          height: '56px', boxSizing: 'content-box',
          paddingTop: 'env(safe-area-inset-top)', paddingLeft: '12px', paddingRight: '14px',
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'rgba(17,26,20,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
        }}>
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            style={{
              width: '40px', height: '40px', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)', cursor: 'pointer',
            }}
          >
            <Menu size={22} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <Logo size={30} radius={9} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>AgroSense</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isLive ? 'var(--accent-primary)' : 'var(--text-muted)', boxShadow: isLive ? '0 0 8px var(--accent-glow)' : 'none' }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: isLive ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>{isLive ? 'Live' : 'Offline'}</span>
          </div>
        </header>

        {/* Dim overlay */}
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 48,
            background: 'rgba(0,0,0,0.55)',
            opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
            transition: 'opacity 0.25s ease',
          }}
        />

        {/* Slide-in drawer */}
        <aside style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 49,
          width: '272px', maxWidth: '82vw',
          background: 'var(--bg-surface)', borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          paddingTop: 'calc(18px + env(safe-area-inset-top))', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: open ? '0 0 44px rgba(0,0,0,0.55)' : 'none',
          overflowY: 'auto',
        }}>
          {/* Brand + close */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Logo size={34} radius={10} />
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>AgroSense</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Smart Irrigation</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close menu" style={{ width: '34px', height: '34px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={17} />
            </button>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '0 12px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', padding: '0 10px 8px' }}>Main</div>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => go(item.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: 'none',
                    background: isActive ? 'var(--accent-muted)' : 'transparent',
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontSize: '14px', fontWeight: isActive ? 600 : 400, cursor: 'pointer',
                    textAlign: 'left', marginBottom: '3px', position: 'relative',
                  }}
                >
                  {isActive && (
                    <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '60%', background: 'var(--accent-primary)', borderRadius: '0 2px 2px 0', boxShadow: '0 0 8px var(--accent-glow)' }} />
                  )}
                  <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
                  {item.label}
                  {item.id === 'ai-advisor' && (
                    <span style={{ marginLeft: 'auto', background: 'var(--accent-primary)', color: 'var(--text-on-accent)', fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', letterSpacing: '0.3px' }}>AI</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer: device status + sign out */}
          <div style={{ padding: '14px 16px 0', margin: '0 4px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: isLive ? 'var(--accent-muted)' : 'var(--bg-elevated)', border: `1px solid ${isLive ? 'var(--accent-glow)' : 'var(--border-subtle)'}` }}>
              {isLive ? (
                <>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-primary)', animation: 'pulse-dot 2s ease infinite', flexShrink: 0 }} />
                  <Wifi size={13} color="var(--accent-primary)" />
                  <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600 }}>Device online</span>
                </>
              ) : (
                <>
                  <WifiOff size={13} color="var(--text-muted)" />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Waiting for device</span>
                </>
              )}
            </div>
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              style={{ width: '100%', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 12px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'transparent', color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer' }}
            >
              <LogOut size={16} strokeWidth={2} />
              Sign out
            </button>
          </div>
        </aside>
      </>
    );
  }

  // ── Desktop: left rail ─────────────────────────────────────────────────────
  return (
    <aside style={{
      width: '220px',
      minHeight: '100vh',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'var(--accent-primary)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px var(--accent-glow)',
          }}>
            <Droplets size={18} color="var(--text-on-accent)" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              AgroSense
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Smart Irrigation
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 10px' }}>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', padding: '0 10px 8px', marginBottom: '4px' }}>
          Main
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: isActive ? 'var(--accent-muted)' : 'transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
                marginBottom: '2px',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)';
              }}
              onMouseLeave={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                  width: '3px', height: '60%',
                  background: 'var(--accent-primary)',
                  borderRadius: '0 2px 2px 0',
                  boxShadow: '0 0 8px var(--accent-glow)',
                }} />
              )}
              <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
              {item.label}
              {item.id === 'ai-advisor' && (
                <span style={{
                  marginLeft: 'auto',
                  background: 'var(--accent-primary)',
                  color: 'var(--text-on-accent)',
                  fontSize: '9px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '4px',
                  letterSpacing: '0.3px',
                }}>AI</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer: device status + sign out */}
      <div style={{ padding: '16px 14px 0', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '9px 12px',
          borderRadius: 'var(--radius-sm)',
          background: isLive ? 'var(--accent-muted)' : 'var(--bg-elevated)',
          border: `1px solid ${isLive ? 'var(--accent-glow)' : 'var(--border-subtle)'}`,
        }}>
          {isLive ? (
            <>
              <span style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: 'var(--accent-primary)',
                animation: 'pulse-dot 2s ease infinite', flexShrink: 0,
              }} />
              <Wifi size={13} color="var(--accent-primary)" />
              <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                Device online
              </span>
            </>
          ) : (
            <>
              <WifiOff size={13} color="var(--text-muted)" />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Waiting for device
              </span>
            </>
          )}
        </div>

        <button
          onClick={onLogout}
          style={{
            width: '100%', marginTop: '8px',
            display: 'flex', alignItems: 'center', gap: '9px',
            padding: '9px 12px',
            borderRadius: 'var(--radius-sm)',
            border: 'none', background: 'transparent',
            color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; (e.currentTarget as HTMLElement).style.color = 'var(--red)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
        >
          <LogOut size={15} strokeWidth={2} />
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
