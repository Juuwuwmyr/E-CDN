import { useState, useEffect, useRef } from 'react';
import '../../styles/chatbot.css';

const BOT_REPLIES = {
  fines:     'You can check and settle your student fines at the CSC Services portal.',
  osas:      'OSAS handles violation tracking. Access your records through the OSAS Services portal.',
  admission: 'For admissions and enrollment, visit the Admissions (ECNESIS) portal.',
  login:     'Use your student number as username and your last name (or registered password) to sign in.',
  help:      'You can access all CDN systems from the portal dashboard. Ask me anything!',
};

const getReply = (text) => {
  const t = text.toLowerCase();
  if (t.includes('fine') || t.includes('csc'))            return BOT_REPLIES.fines;
  if (t.includes('osas') || t.includes('viol'))           return BOT_REPLIES.osas;
  if (t.includes('admiss') || t.includes('enroll'))       return BOT_REPLIES.admission;
  if (t.includes('login') || t.includes('pass') || t.includes('password')) return BOT_REPLIES.login;
  if (t.includes('help') || t.includes('how'))            return BOT_REPLIES.help;
  return "I'm not sure about that. Try asking about fines, OSAS, admissions, or login help.";
};

export default function ChatbotWidget() {
  const [open,     setOpen]     = useState(false);
  const [input,    setInput]    = useState('');
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! I\'m the CDN Portal Assistant. How can I help you today?' },
  ]);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages(m => [...m, { from: 'user', text }]);
    setInput('');
    setTimeout(() => setMessages(m => [...m, { from: 'bot', text: getReply(text) }]), 600);
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
                <p className="cw-status"><span className="cw-online" />Online</p>
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
              <button key={p} className="cw-prompt" onClick={() => setInput(p)}>{p}</button>
            ))}
          </div>

          {/* Messages */}
          <div className="cw-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`cw-msg cw-msg--${msg.from}`}>
                {msg.from === 'bot' && (
                  <div className="cw-msg-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                  </div>
                )}
                <div className="cw-bubble">{msg.text}</div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <form className="cw-input-row" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <input
              type="text"
              className="cw-input"
              placeholder="Ask about fines, OSAS, admissions..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
            />
            <button type="submit" className="cw-send" aria-label="Send">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
