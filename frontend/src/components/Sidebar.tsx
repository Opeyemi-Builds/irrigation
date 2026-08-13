import React from 'react';
import {
  LayoutDashboard,
  Droplets,
  Thermometer,
  Wind,
  Bot,
  Settings,
  Bell,
  Wifi,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sensors', label: 'Sensors', icon: Thermometer },
  { id: 'irrigation', label: 'Irrigation', icon: Droplets },
  { id: 'weather', label: 'Weather', icon: Wind },
  { id: 'ai-advisor', label: 'AI Advisor', icon: Bot },
];

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
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
      <div style={{ padding: '0 20px 32px' }}>
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

      {/* System status badge */}
      <div style={{ padding: '0 14px 24px' }}>
        <div style={{
          background: 'rgba(245, 166, 35, 0.08)',
          border: '1px solid rgba(245, 166, 35, 0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <div style={{
            width: '7px', height: '7px',
            borderRadius: '50%',
            background: 'var(--amber)',
            animation: 'pulse-dot 2s ease infinite',
            flexShrink: 0,
          }} />
          <span style={{ fontSize: '11px', color: 'var(--amber)', fontWeight: 500 }}>Attention needed</span>
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

      {/* Bottom actions */}
      <div style={{ padding: '16px 10px 0', borderTop: '1px solid var(--border-subtle)' }}>
        {[
          { icon: Bell, label: 'Alerts', badge: '3' },
          { icon: Settings, label: 'Settings' },
        ].map(({ icon: Icon, label, badge }) => (
          <button key={label} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 12px', borderRadius: 'var(--radius-sm)',
            border: 'none', background: 'transparent',
            color: 'var(--text-secondary)', fontSize: '13px',
            cursor: 'pointer', marginBottom: '2px',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            <Icon size={15} strokeWidth={2} />
            {label}
            {badge && (
              <span style={{
                marginLeft: 'auto',
                background: 'var(--red)',
                color: 'white',
                fontSize: '9px', fontWeight: 700,
                padding: '1px 5px', borderRadius: '4px',
              }}>{badge}</span>
            )}
          </button>
        ))}

        {/* Connection status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 12px 0', marginTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
          <Wifi size={11} color="var(--accent-primary)" />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Connected · 4 sensors</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
