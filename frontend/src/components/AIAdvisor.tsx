import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader } from 'lucide-react';
import { AIMessage } from '../types';
import { useLiveData } from '../hooks/useLiveData';
import { getFarmProfile } from '../lib/farm';
import { getAdvisorReply, ADVISOR_SUGGESTIONS, AdvisorContext } from '../lib/advisor';
import Mascot from './Mascot';

const SUGGESTIONS = ADVISOR_SUGGESTIONS.slice(0, 4);

const AIAdvisor: React.FC = () => {
  const live = useLiveData();

  const buildContext = (): AdvisorContext => ({
    temperature: live.temperature,
    humidity: live.humidity,
    soilMoisture: live.soilMoisture,
    reservoirPct: live.reservoirPct,
    pumpStatus: live.pumpStatus,
    hasData: live.hasData,
    profile: getFarmProfile(),
  });

  const [messages, setMessages] = useState<AIMessage[]>(() => [
    {
      id: '0',
      role: 'assistant',
      content: getAdvisorReply('hello', {
        temperature: null, humidity: null, soilMoisture: null,
        reservoirPct: null, pumpStatus: null, hasData: false,
        profile: getFarmProfile(),
      }),
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages(p => [...p, userMsg]);
    setInput('');
    setLoading(true);

    // Compute the reply locally from live readings + farm profile.
    const reply = getAdvisorReply(text, buildContext());
    window.setTimeout(() => {
      setMessages(p => [...p, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      }]);
      setLoading(false);
    }, 300);
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
        return <strong key={i} style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>{line.slice(2, -2)}</strong>;
      }
      if (line.includes('**')) {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return <p key={i} style={{ marginBottom: '4px' }}>{parts.map((p, j) => p.startsWith('**') && p.endsWith('**') ? <strong key={j} style={{ color: 'var(--text-primary)' }}>{p.slice(2, -2)}</strong> : p)}</p>;
      }
      if (line.startsWith('- ') || /^\d+\./.test(line)) {
        return <li key={i} style={{ marginBottom: '3px', marginLeft: '12px' }}>{line.replace(/^[-\d.]\s*/, '')}</li>;
      }
      if (line === '') return <br key={i} />;
      return <p key={i} style={{ marginBottom: '4px' }}>{line}</p>;
    });
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      display: 'flex', flexDirection: 'column',
      height: '520px',
    }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '38px', height: '38px', background: 'var(--accent-muted)', border: '1px solid var(--accent-glow)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
          <Mascot size={40} variant="head" />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Sprout · AI Advisor</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: live.hasData ? 'var(--accent-primary)' : 'var(--text-muted)', animation: live.hasData ? 'pulse-dot 2s ease infinite' : 'none' }} />
            {live.hasData ? 'Reading your live sensors' : 'Ready — waiting for device'}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', gap: '10px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0, background: msg.role === 'assistant' ? 'var(--accent-muted)' : 'var(--bg-elevated)', border: `1px solid ${msg.role === 'assistant' ? 'var(--accent-glow)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: msg.role === 'assistant' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
              {msg.role === 'assistant' ? <Bot size={13} /> : <User size={13} />}
            </div>
            <div style={{ maxWidth: '80%', background: msg.role === 'user' ? 'var(--accent-muted)' : 'var(--bg-surface)', border: `1px solid ${msg.role === 'user' ? 'var(--accent-glow)' : 'var(--border-subtle)'}`, borderRadius: msg.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px', padding: '10px 14px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {renderContent(msg.content)}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--accent-muted)', border: '1px solid var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={13} color="var(--accent-primary)" />
            </div>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '4px 12px 12px 12px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Loader size={12} color="var(--accent-primary)" style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div style={{ padding: '0 16px 8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => sendMessage(s)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '4px 10px', fontSize: '11px', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent-primary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
            >{s}</button>
          ))}
        </div>
      )}

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
          placeholder="Ask about irrigation, soil, water..."
          style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: '12.5px', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.15s' }}
          onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-primary)'}
          onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
        />
        <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading} style={{ width: '34px', height: '34px', background: input.trim() && !loading ? 'var(--accent-primary)' : 'var(--bg-elevated)', border: 'none', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', transition: 'background 0.15s', flexShrink: 0 }}>
          <Send size={13} color={input.trim() && !loading ? 'var(--text-on-accent)' : 'var(--text-muted)'} />
        </button>
      </div>
    </div>
  );
};

export default AIAdvisor;
