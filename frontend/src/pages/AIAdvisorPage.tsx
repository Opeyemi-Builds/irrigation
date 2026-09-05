import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader, Thermometer, Droplets, Leaf, Power, Waves, RefreshCw, BookOpen } from 'lucide-react';
import { AIMessage } from '../types';
import { useLiveData } from '../hooks/useLiveData';
import { getFarmProfile, describeProfile, buildZones } from '../lib/farm';
import { getAdvisorReply, ADVISOR_SUGGESTIONS, AdvisorContext } from '../lib/advisor';
import { useIsMobile } from '../hooks/useIsMobile';
import Mascot from '../components/Mascot';

const zoneStatusColor: Record<string, { bg: string; color: string }> = {
  active:    { bg: 'var(--accent-muted)', color: 'var(--accent-primary)' },
  paused:    { bg: 'var(--amber-muted)',  color: 'var(--amber)' },
  scheduled: { bg: 'var(--blue-muted)',   color: 'var(--blue)' },
  idle:      { bg: 'var(--bg-elevated)',  color: 'var(--text-muted)' },
};

// Optimal bands for the small status dot beside each sensor.
const bands: Record<string, [number, number]> = { temperature: [20, 35], humidity: [50, 80], soilMoisture: [40, 70] };
const dotColor = (key: string, value: number | null): string => {
  if (value == null) return 'var(--text-muted)';
  const [lo, hi] = bands[key];
  if (value < lo * 0.7 || value > hi * 1.2) return 'var(--red)';
  if (value < lo || value > hi) return 'var(--amber)';
  return 'var(--accent-primary)';
};

const renderMarkdown = (text: string) => {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
      return <div key={i} style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: i > 0 ? '10px' : 0, marginBottom: '3px' }}>{line.slice(2, -2)}</div>;
    }
    if (line.includes('**')) {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return <p key={i} style={{ marginBottom: '3px' }}>{parts.map((p, j) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={j} style={{ color: 'var(--text-primary)' }}>{p.slice(2, -2)}</strong>
          : p
      )}</p>;
    }
    if (line.startsWith('- ') || /^\d+\./.test(line)) {
      return <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '3px' }}>
        <span style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>·</span>
        <span>{line.replace(/^[-\d.]\s*/, '')}</span>
      </div>;
    }
    if (line === '') return <div key={i} style={{ height: '6px' }} />;
    return <p key={i} style={{ marginBottom: '3px' }}>{line}</p>;
  });
};

const AIAdvisorPage: React.FC = () => {
  const live = useLiveData();
  const isMobile = useIsMobile();
  const profile = getFarmProfile();
  const zones = buildZones({ soilMoisture: live.soilMoisture, pumpStatus: live.pumpStatus, hasData: live.hasData }, profile);

  const buildContext = (): AdvisorContext => ({
    temperature: live.temperature,
    humidity: live.humidity,
    soilMoisture: live.soilMoisture,
    reservoirPct: live.reservoirPct,
    pumpStatus: live.pumpStatus,
    hasData: live.hasData,
    profile,
  });

  const [messages, setMessages] = useState<AIMessage[]>(() => [
    {
      id: '0', role: 'assistant',
      content: getAdvisorReply('hello', {
        temperature: null, humidity: null, soilMoisture: null,
        reservoirPct: null, pumpStatus: null, hasData: false, profile: getFarmProfile(),
      }),
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: AIMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages(p => [...p, userMsg]);
    setInput('');
    setLoading(true);

    const reply = getAdvisorReply(text, buildContext());
    window.setTimeout(() => {
      setMessages(p => [...p, { id: (Date.now() + 1).toString(), role: 'assistant', content: reply, timestamp: new Date().toISOString() }]);
      setLoading(false);
    }, 320);
  };

  const sensorRows: { Icon: any; label: string; key: 'temperature' | 'humidity' | 'soilMoisture'; value: string; color: string }[] = [
    { Icon: Thermometer, label: 'Temperature', key: 'temperature',  value: live.temperature != null ? `${live.temperature}°C` : '—', color: '#ff7c5e' },
    { Icon: Droplets,    label: 'Humidity',    key: 'humidity',     value: live.humidity != null ? `${live.humidity}%` : '—',       color: '#5bbfef' },
    { Icon: Leaf,        label: 'Soil Moisture', key: 'soilMoisture', value: live.soilMoisture != null ? `${live.soilMoisture}%` : '—', color: '#5dea8a' },
  ];

  return (
    <div style={{ display: 'flex', height: isMobile ? 'calc(100vh - 56px - env(safe-area-inset-top) - env(safe-area-inset-bottom))' : '100vh', overflow: 'hidden' }}>
      {/* Left context panel */}
      <div style={{
        width: '260px', flexShrink: 0,
        background: 'var(--bg-surface)', borderRight: '1px solid var(--border)',
        display: isMobile ? 'none' : 'flex', flexDirection: 'column', padding: '24px 16px', overflowY: 'auto',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '16px' }}>
          Live Context
        </div>

        {/* Sensors */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Sensors</div>
          {sensorRows.map(({ Icon, label, key, value, color }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 10px', borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', marginBottom: '6px',
            }}>
              <Icon size={13} color={color} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{label}</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: value === '—' ? 'var(--text-muted)' : 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{value}</div>
              </div>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor(key, live[key]) }} />
            </div>
          ))}
        </div>

        {/* System */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>System</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', marginBottom: '6px' }}>
            <Power size={13} color={live.pumpStatus ? 'var(--accent-primary)' : 'var(--text-muted)'} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Pump</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{live.pumpStatus == null ? '—' : live.pumpStatus ? 'Running' : 'Off'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <Waves size={13} color="#5bbfef" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Reservoir</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{live.reservoirPct != null ? `${live.reservoirPct}%` : '—'}</div>
            </div>
          </div>
        </div>

        {/* Farm profile */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Farm</div>
          <div style={{ background: 'var(--accent-muted)', border: '1px solid var(--accent-glow)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '2px' }}>{profile?.farmName?.trim() || 'Not set up'}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5, textTransform: 'capitalize' }}>{profile ? describeProfile(profile) : 'Complete onboarding for tailored advice'}</div>
          </div>
        </div>

        {/* Zones */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Zones</div>
          {zones.map(z => {
            const c = zoneStatusColor[z.status];
            return (
              <div key={z.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '130px' }}>{z.name}</div>
                <span style={{ fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '10px', background: c.bg, color: c.color, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{z.status}</span>
              </div>
            );
          })}
        </div>

        {/* Quick prompts */}
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Quick Prompts</div>
          {ADVISOR_SUGGESTIONS.map(p => (
            <button key={p} onClick={() => send(p)} style={{
              width: '100%', textAlign: 'left',
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)', padding: '7px 10px',
              fontSize: '11px', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '5px',
              display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent-primary)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
            >
              <BookOpen size={10} />
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Chat header */}
        <div style={{ padding: isMobile ? '14px 16px' : '20px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-surface)' }}>
          <div style={{ width: '44px', height: '44px', background: 'var(--accent-muted)', border: '1px solid var(--accent-glow)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            <Mascot size={48} variant="head" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Sprout · AI Farm Advisor</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: live.hasData ? 'var(--accent-primary)' : 'var(--text-muted)', animation: live.hasData ? 'pulse-dot 2s infinite' : 'none' }} />
              {live.hasData ? 'Reading your live sensors' : 'Ready — waiting for device'}
            </div>
          </div>
          <button onClick={() => setMessages(msgs => [msgs[0]])} style={{
            marginLeft: 'auto', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            padding: '5px 12px', fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            <RefreshCw size={11} /> New chat
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', gap: '12px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                background: msg.role === 'assistant' ? 'var(--accent-muted)' : 'var(--bg-elevated)',
                border: `1px solid ${msg.role === 'assistant' ? 'var(--accent-glow)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: msg.role === 'assistant' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              }}>
                {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
              </div>
              <div style={{
                maxWidth: isMobile ? '85%' : '72%',
                background: msg.role === 'user' ? 'var(--accent-muted)' : 'var(--bg-card)',
                border: `1px solid ${msg.role === 'user' ? 'var(--accent-glow)' : 'var(--border)'}`,
                borderRadius: msg.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.65,
              }}>
                {renderMarkdown(msg.content)}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--accent-muted)', border: '1px solid var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={14} color="var(--accent-primary)" />
              </div>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '4px 14px 14px 14px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader size={13} color="var(--accent-primary)" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: isMobile ? '12px 16px' : '16px 28px', borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          {isMobile && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', WebkitOverflowScrolling: 'touch' }}>
              {ADVISOR_SUGGESTIONS.map(p => (
                <button key={p} onClick={() => send(p)} style={{
                  flexShrink: 0, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  borderRadius: '20px', padding: '7px 14px', fontSize: '12px', color: 'var(--text-secondary)',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                  {p}
                </button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Ask about irrigation, soil, water, crop health..."
              rows={2}
              style={{
                flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                padding: '10px 14px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', resize: 'none', lineHeight: 1.5, transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-primary)'}
              onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              style={{
                width: '42px', height: '42px', flexShrink: 0,
                background: input.trim() && !loading ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                border: 'none', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', transition: 'all 0.15s',
              }}
            >
              <Send size={15} color={input.trim() && !loading ? 'var(--text-on-accent)' : 'var(--text-muted)'} />
            </button>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Enter to send · Shift+Enter for new line · Advice is generated from your live sensors and farm profile
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAdvisorPage;
