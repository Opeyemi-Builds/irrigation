import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader, Sparkles, Thermometer, Droplets, Leaf, CloudRain, RefreshCw, BookOpen } from 'lucide-react';
import { AIMessage } from '../types';
import { mockDashboardData } from '../data/mockData';

const data = mockDashboardData;

const QUICK_PROMPTS = [
  { label: 'Irrigation Plan', text: 'Give me an irrigation plan for today based on current conditions.' },
  { label: 'Soil Health', text: 'How is my soil health looking and what should I do?' },
  { label: 'Rain Impact', text: 'How will the incoming rain affect my irrigation schedule?' },
  { label: 'Crop Stress', text: 'Are any of my crops showing signs of water stress?' },
  { label: 'Water Saving', text: 'How can I reduce water usage without harming my crops?' },
  { label: 'Weekly Summary', text: 'Give me a summary of this week\'s farm conditions.' },
];

const MOCK_RESPONSES: Record<string, string> = {
  plan: `Based on current sensor readings, here's your irrigation plan for today:

**Zone 1 – North Field (Maize)**
Soil moisture is at 38% — below the 45% threshold for maize. Run for **35 minutes** as soon as possible. Hold off after 8h due to incoming rain (72% at 9h).

**Zone 2 – South Field (Tomato)**
Moisture at 55% — acceptable. Scheduled cycle at 14h. If rainfall at 9h delivers >5mm, skip the afternoon cycle.

**Zone 3 – East Patch (Pepper)**
Moisture is healthy at 72%. No irrigation needed today. Resume tomorrow morning.

**Zone 4 – West Field (Cassava)**
Currently paused. Moisture at 44% is borderline. Run a 20-minute cycle tonight after 18h when rain has cleared.

**Estimated water use today: ~840 litres** (vs 1,200L without rain forecast optimization)`,

  soil: `Your soil health snapshot:

**North Field (Maize):** 🟡 Moderate concern
Moisture at 38% is below optimal (45–65%). Trend is downward — likely from the current heat. Irrigate soon. If this pattern continues for 2+ days, consider checking for drainage issues or compact soil.

**South Field (Tomato):** 🟢 Good
55% moisture is well within the tomato optimal range. No action needed.

**East Patch (Pepper):** 🔵 Saturated
72% is on the high end for pepper. Hold irrigation and monitor. Peppers are susceptible to root rot above 75%.

**West Field (Cassava):** 🟡 Moderate
44% is slightly low for cassava (ideal: 50–70%). Not urgent, but schedule irrigation within 12 hours.`,

  rain: `The forecast shows **rain arriving at 9h with 72% probability**, peaking at 12h (88%).

How this affects your schedule:

**Zones paused automatically:** Zone 2 (already scheduled for 14h) — that cycle will be skipped if the rain pause automation is enabled.

**Recommended actions:**
- Run Zone 1 now (it needs water regardless of rain — current moisture too low to wait)
- Let rain cover Zones 2 and 3
- After rain clears (~15h), re-check Zone 4 moisture before evening cycle

**Expected rainfall:** ~8–12mm based on probability and cloud coverage. That's roughly equivalent to a 45-minute irrigation session — significant savings.`,

  default: `I've reviewed your current farm data. Here's my overall assessment:

**Conditions Summary:**
- Temperature 28°C is within the normal range but on the warm side — watch for heat stress on tomato plants
- Humidity at 62% is healthy, though it will rise as rain approaches
- Soil moisture in Zone 1 needs immediate attention (38%)

**Top 3 actions for today:**
1. Irrigate Zone 1 (North Maize) in the next 2 hours
2. Let the incoming rainfall at 9h cover Zones 2–3
3. Check Zone 4 tonight and run a short cycle if rain didn't reach it

Is there anything specific you'd like to go deeper on?`,
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const getResponse = (text: string): string => {
  const l = text.toLowerCase();
  if (l.includes('plan') || l.includes('today') || l.includes('schedule')) return MOCK_RESPONSES.plan;
  if (l.includes('soil') || l.includes('health') || l.includes('stress')) return MOCK_RESPONSES.soil;
  if (l.includes('rain') || l.includes('forecast') || l.includes('weather')) return MOCK_RESPONSES.rain;
  return MOCK_RESPONSES.default;
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
  const data = mockDashboardData;
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '0', role: 'assistant',
      content: "Hello! I'm your AI farming advisor. I have live access to your sensor readings, zone statuses, and weather forecast. Ask me anything about your farm — irrigation timing, crop health, water management, or what to do right now.",
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: AIMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages(p => [...p, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.id !== '0')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(`${API_BASE}/api/v1/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({
          message: text,
          history,
          sensor_data: {
            temperature: data.temperature.current,
            humidity: data.humidity.current,
            soil_moisture: data.soilMoisture.current,
          },
          farm_profile: {
            farm_name: 'Demo Farm',
            crop: 'maize',
            growth_stage: 'vegetative',
            soil_type: 'loamy',
            area_hectares: 1.0,
          },
          weather: {
            condition: data.forecast[0]?.condition || 'Unknown',
            temperature: data.forecast[0]?.temp || 28,
            humidity: data.forecast[0]?.humidity || 65,
            rain_probability_3h: data.forecast[1]?.rainProbability || 20,
            rain_probability_6h: data.forecast[2]?.rainProbability || 45,
          },
          irrigation: {
            is_active: false,
            last_irrigated_minutes_ago: 120,
            reservoir_level_pct: 67,
          },
        }),
      });

      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      const aiMsg: AIMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: json.reply, timestamp: new Date().toISOString() };
      setMessages(p => [...p, aiMsg]);
    } catch {
      const aiMsg: AIMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Could not reach the AI service. Make sure the backend is running at `http://localhost:8000`.', timestamp: new Date().toISOString() };
      setMessages(p => [...p, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Left context panel */}
      <div style={{
        width: '260px', flexShrink: 0,
        background: 'var(--bg-surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '24px 16px',
        overflowY: 'auto',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '16px' }}>
          Live Context
        </div>

        {/* Sensor context */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Sensors</div>
          {[
            { Icon: Thermometer, label: 'Temperature', value: `${data.temperature.current}°C`, color: '#ff7c5e', status: data.temperature.status },
            { Icon: Droplets, label: 'Humidity', value: `${data.humidity.current}%`, color: '#5bbfef', status: data.humidity.status },
            { Icon: Leaf, label: 'Soil Moisture', value: `${data.soilMoisture.current}%`, color: '#5dea8a', status: data.soilMoisture.status },
          ].map(({ Icon, label, value, color, status }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 10px', borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              marginBottom: '6px',
            }}>
              <Icon size={13} color={color} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{label}</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color, fontFamily: 'var(--font-display)' }}>{value}</div>
              </div>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: status === 'optimal' ? '#4ade80' : status === 'warning' ? '#fbbf24' : '#f87171',
              }} />
            </div>
          ))}
        </div>

        {/* Weather context */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Weather</div>
          <div style={{ background: 'rgba(91,191,239,0.08)', border: '1px solid rgba(91,191,239,0.15)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <CloudRain size={12} color="#5bbfef" />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#5bbfef' }}>Rain at 9h</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>72% probability · ~10mm expected</div>
          </div>
        </div>

        {/* Zone context */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Zones</div>
          {data.zones.map(z => (
            <div key={z.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '130px' }}>{z.name.split(' — ')[0]}</div>
              <span style={{
                fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '10px',
                background: z.status === 'active' ? 'rgba(74,222,128,0.1)' : z.status === 'paused' ? 'rgba(245,166,35,0.1)' : 'var(--bg-elevated)',
                color: z.status === 'active' ? '#4ade80' : z.status === 'paused' ? '#f5a623' : 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.3px',
              }}>{z.status}</span>
            </div>
          ))}
        </div>

        {/* Quick prompts */}
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Quick Prompts</div>
          {QUICK_PROMPTS.map(p => (
            <button key={p.label} onClick={() => send(p.text)} style={{
              width: '100%', textAlign: 'left',
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)', padding: '7px 10px',
              fontSize: '11px', color: 'var(--text-secondary)',
              cursor: 'pointer', marginBottom: '5px',
              display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent-primary)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
            >
              <BookOpen size={10} />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Chat header */}
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-surface)' }}>
          <div style={{ width: '38px', height: '38px', background: 'var(--accent-muted)', border: '1px solid rgba(93,234,138,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={16} color="var(--accent-primary)" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>AI Farm Advisor</div>
            <div style={{ fontSize: '11px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-primary)', animation: 'pulse-dot 2s infinite' }} />
              Online · Analyzing live farm data
            </div>
          </div>
          <button onClick={() => setMessages(msgs => [msgs[0]])} style={{
            marginLeft: 'auto', background: 'transparent',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            padding: '5px 12px', fontSize: '11px', color: 'var(--text-muted)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            <RefreshCw size={11} /> New chat
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', gap: '12px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                background: msg.role === 'assistant' ? 'var(--accent-muted)' : 'var(--bg-elevated)',
                border: `1px solid ${msg.role === 'assistant' ? 'rgba(93,234,138,0.2)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: msg.role === 'assistant' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              }}>
                {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
              </div>
              <div style={{
                maxWidth: '72%',
                background: msg.role === 'user' ? 'var(--accent-muted)' : 'var(--bg-card)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(93,234,138,0.15)' : 'var(--border)'}`,
                borderRadius: msg.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                padding: '12px 16px',
                fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.65,
              }}>
                {renderMarkdown(msg.content)}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--accent-muted)', border: '1px solid rgba(93,234,138,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={14} color="var(--accent-primary)" />
              </div>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '4px 14px 14px 14px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader size={13} color="var(--accent-primary)" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Analyzing your farm data...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Ask about irrigation, soil health, weather impact, crop stress..."
              rows={2}
              style={{
                flex: 1, background: 'var(--bg-card)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                padding: '10px 14px', fontSize: '13px', color: 'var(--text-primary)',
                outline: 'none', resize: 'none', lineHeight: 1.5,
                transition: 'border-color 0.15s',
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
                border: 'none', borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
              }}
            >
              <Send size={15} color={input.trim() && !loading ? 'var(--text-on-accent)' : 'var(--text-muted)'} />
            </button>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Enter to send · Shift+Enter for new line · AI has access to all live sensor and weather data
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAdvisorPage;
