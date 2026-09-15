import { useState, useEffect, useRef } from 'react';
import '../../styles/chatbot.css';

const SYSTEM_PROMPT = `You are the CDN Portal Assistant for Colegio De Naujan (CDN) in Naujan, Oriental Mindoro, Philippines.
You help students and staff with questions about:
- Student Fines (CSC Services) — check and settle outstanding fines at https://student-fines-hub-vf9z.vercel.app/
- OSAS Records — conduct and violation tracking at https://osas-sys.duckdns.org/
- Admissions (ECNESIS Portal) — online enrollment at https://ecnesis.duckdns.org/
- Login help — students use their student number + last name (or registered password)
- General CDN portal questions

Keep responses concise, friendly, and helpful. Use Filipino-English (Taglish) if the user writes in Filipino. 
Do not answer questions unrelated to CDN or the portal. 
If asked about something outside CDN, politely redirect to CDN-related topics.`;

const FALLBACK_REPLIES = {
  fines:     'You can check and settle your student fines at the CSC Services portal.',
  osas:      'OSAS handles violation tracking. Access your records through the OSAS Services portal.',
  admission: 'For admissions and enrollment, visit the Admissions (ECNESIS) portal.',
  login:     'Use your student number as username and your last name (or registered password) to sign in.',
  help:      'You can access all CDN systems from the portal dashboard. Ask me anything!',
};

const getFallbackReply = (text) => {
  const t = text.toLowerCase();
  if (t.includes('fine') || t.includes('csc'))                  return FALLBACK_REPLIES.fines;
  if (t.includes('osas') || t.includes('viol'))                 return FALLBACK_REPLIES.osas;
  if (t.includes('admiss') || t.includes('enroll'))             return FALLBACK_REPLIES.admission;
  if (t.includes('login') || t.includes('pass'))                return FALLBACK_REPLIES.login;
  return "I'm not sure about that. Try asking about fines, OSAS, admissions, or login help.";
};

async function askGroq(messages) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
    }),
  });

  if (!res.ok) throw new Error(`Chat API error: ${res.status}`);
  const data = await res.json();
  return data.reply ?? 'Sorry, I could not process that.';
}

export default function ChatbotWidget() {
  const [open,     setOpen]     = useState(false);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I\'m the CDN Portal Assistant. How can I help you today?' },
  ]);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;
    setInput('');

    const userMsg = { role: 'user', text };
    setMessages(m => [...m, userMsg]);
    setLoading(true);

    // Build history for Groq (exclude the initial greeting)
    const history = [...messages.slice(1), userMsg]
      .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text }));

    try {
      const reply = await askGroq(history);
      setMessages(m => [...m, { role: 'assistant', text: reply }]);
    } catch (err) {
      console.error('Groq error:', err);
      // Fallback to keyword replies if API fails
      setMessages(m => [...m, { role: 'assistant', text: getFallbackReply(text) }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── FAB ── */}
      {!open && (
        <button className="cw-fab" onClick={() => setOpen(true)} aria-label="Open CDN Assistant">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            <path d="M8 10h8M8 14h5"/>
          </svg>
          <span className="cw-fab-label">Ask CDN</span>
        </button>
      )}

      {/* ── CHAT PANEL ── */}
      {open && (
        <div className="cw-panel" role="dialog" aria-label="CDN Portal Assistant">

          {/* Header */}
          <div className="cw-header">
            <div className="cw-header-left">
              <div className="cw-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </div>
              <div>
                <p className="cw-title">CDN Assistant</p>
                <p className="cw-status"><span className="cw-online" />AI Powered</p>
              </div>
            </div>
            <button className="cw-close" onClick={() => setOpen(false)} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6"  y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Quick prompts */}
          <div className="cw-prompts">
            {['Check fines', 'OSAS records', 'Admission info', 'Login help'].map(p => (
              <button key={p} className="cw-prompt" onClick={() => send(p)} disabled={loading}>{p}</button>
            ))}
          </div>

          {/* Messages */}
          <div className="cw-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`cw-msg cw-msg--${msg.role === 'assistant' ? 'bot' : 'user'}`}>
                {msg.role === 'assistant' && (
                  <div className="cw-msg-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                  </div>
                )}
                <div className="cw-bubble">{msg.text}</div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="cw-msg cw-msg--bot">
                <div className="cw-msg-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                </div>
                <div className="cw-bubble cw-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <form className="cw-input-row" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <input
              type="text"
              className="cw-input"
              placeholder="Ask anything about CDN..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button type="submit" className="cw-send" aria-label="Send" disabled={loading || !input.trim()}>
              {loading ? (
                <span className="cw-send-spinner" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
