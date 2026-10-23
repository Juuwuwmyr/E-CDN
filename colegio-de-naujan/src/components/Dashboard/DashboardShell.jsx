/**
 * DashboardShell
 * ─────────────────────────────────────────────
 * Persistent chrome: topbar, sidebar/bottom-nav,
 * floating chatbot FAB + modal, hero banner.
 *
 * Props
 *   user        – current user object
 *   onLogout    – () => void
 *   activeTab   – string  ('overview' | 'activity' | 'admin' | ...)
 *   onTabChange – (tab: string) => void
 *   onRoute     – (path: string) => void
 *   onDropdownItem – (label: string, tab?: string) => void
 *   children    – active tab content
 */
import { useRef, useState, useEffect } from 'react';
import cdnLogo           from '../../assets/images/logo.png';
import bagongPilipinas   from '../../assets/images/bagong-pilipinas-seeklogo.png';
import {
  NAV_ITEMS, NAV_GROUPS, DROPDOWN_ITEMS, BANNERS,
  SYSTEMS, getDayDate, getGreeting,
} from './constants';
import SettingsDrawer from './SettingsPage';
import { sendToGroq } from '../../lib/groqChat';
import '../../styles/dashboard.css';

/* ── HeroBanner (exported so tab pages can embed it) ─────── */
export const HeroBanner = ({ user }) => {
  const [idx, setIdx] = useState(0);
  const timer = useRef(null);
  useEffect(() => {
    timer.current = setInterval(() => setIdx(i => (i + 1) % BANNERS.length), 5000);
    return () => clearInterval(timer.current);
  }, []);

  return (
    <div className="db-hero">
      <div className="db-hero-noise"  aria-hidden="true" />
      <div className="db-hero-stripe" aria-hidden="true" />
      <div className="db-hero-inner">
        <div className="db-hero-left">
          <div className="db-hero-badge">
            <span className="db-hero-badge-dot" />
            Portal Active
          </div>
          <h1 className="db-hero-greeting">
            {getGreeting()},<br />
            <span className="db-hero-name">{user?.name ?? 'User'}</span>
          </h1>
          <p className="db-hero-sub">
            Welcome to <strong>CDN E-Portal</strong> — your gateway to all Colegio De Naujan systems.
          </p>
          <div className="db-hero-pills">
            <span className="db-hero-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {SYSTEMS.length} Systems Connected
            </span>
            <span className="db-hero-pill db-hero-pill--gold">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              AY 2026-2027
            </span>
          </div>
        </div>
        <img src={bagongPilipinas} alt="Bagong Pilipinas" className="db-hero-bp" />
      </div>
    </div>
  );
};

/* ── DashboardShell ──────────────────────────────────────── */
const DashboardShell = ({ user, onLogout, activeTab, onTabChange, onRoute, onDropdownItem, children }) => {
  const profileRef  = useRef(null);
  const notifRef    = useRef(null);
  const chatEndRef  = useRef(null);

  const [profileOpen,   setProfileOpen]   = useState(false);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [chatOpen,      setChatOpen]      = useState(false);
  const [settingsOpen,  setSettingsOpen]  = useState(false);
  const [chatInput,     setChatInput]     = useState('');
  const [chatMessages,  setChatMessages]  = useState([
    { from: 'bot', text: "Hi! I'm the CDN Portal Assistant. How can I help you today?" },
  ]);

  /* close dropdowns on outside click */
  useEffect(() => {
    const h = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* auto-scroll chat */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatOpen]);

  const [chatLoading, setChatLoading] = useState(false);

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    const userMsg = { from: 'user', text };
    setChatMessages(m => [...m, userMsg]);
    setChatInput('');
    setChatLoading(true);

    // Build message history (last 6 messages for context)
    const history = [...chatMessages, userMsg]
      .slice(-6)
      .map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }));

    try {
      const reply = await sendToGroq(history);
      setChatMessages(m => [...m, { from: 'bot', text: reply }]);
    } catch (err) {
      setChatMessages(m => [...m, {
        from: 'bot',
        text: 'Sorry, the assistant is temporarily unavailable. Please try again.',
      }]);
      console.error('[Chat]', err.message);
    } finally {
      setChatLoading(false);
    }
  };

  /* filter nav items by role */
  const visibleNav = NAV_ITEMS.filter(item => !item.role || user?.role === item.role);

  return (
    <div className="db-root">

      {/* ══ TOPBAR ══════════════════════════════════════════ */}
      <header className="db-topbar">
        <div className="db-topbar-inner">

          <div className="db-topbar-brand">
            <img src={cdnLogo} alt="CDN" className="db-topbar-logo" />
            <div className="db-topbar-wordmark">
              <span className="db-topbar-school">CDN</span>
              <span className="db-topbar-portal">E-Portal</span>
            </div>
          </div>

          <div className="db-topbar-meta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="10" r="3" />
              <path d="M12 2a8 8 0 010 16c-4 0-8-5.37-8-8a8 8 0 0116 0z" />
            </svg>
            <span>Naujan, Oriental Mindoro</span>
            <span className="db-topbar-sep">·</span>
            <span>{getDayDate()}</span>
          </div>

          <div className="db-topbar-actions">
            {/* Bell */}
            <div className="db-notif-wrap" ref={notifRef}>
              <button className="db-icon-btn"
                onClick={() => { setNotifOpen(v => !v); setProfileOpen(false); }}
                aria-label="Notifications">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                <span className="db-notif-dot" />
              </button>
              {notifOpen && (
                <div className="db-dropdown db-notif-panel">
                  <p className="db-dropdown-head">Notifications</p>
                  {[
                    { text: 'Admissions portal is now live',    time: '2 hrs ago',  dot: '#002280' },
                    { text: 'OSAS records updated for AY 2026', time: 'Yesterday',  dot: '#C8102E' },
                    { text: 'New fines posted by CSC',          time: '3 days ago', dot: '#C8960C' },
                  ].map((n, i) => (
                    <div key={i} className="db-notif-item">
                      <span className="db-notif-item-dot" style={{ background: n.dot }} />
                      <div>
                        <p className="db-notif-item-text">{n.text}</p>
                        <p className="db-notif-item-time">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="db-profile-wrap" ref={profileRef}>
              <button className="db-profile-btn"
                onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); }}
                aria-label="Account menu">
                <div className="db-avatar">{user?.name?.charAt(0).toUpperCase() ?? 'U'}</div>
                <div className="db-profile-text">
                  <span className="db-profile-greeting">
                    {getGreeting()}, <strong>{user?.name?.split(' ')[0] ?? 'User'}</strong>
                  </span>
                  <span className="db-profile-role">{user?.role ?? 'Member'}</span>
                </div>
                <svg className="db-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {profileOpen && (
                <div className="db-dropdown db-profile-panel">
                  <div className="db-profile-panel-header">
                    <div className="db-avatar db-avatar--lg">{user?.name?.charAt(0).toUpperCase() ?? 'U'}</div>
                    <div>
                      <p className="db-pp-name">{user?.name}</p>
                      <p className="db-pp-role">{user?.role}</p>
                    </div>
                  </div>
                  <div className="db-dropdown-divider" />
                  {DROPDOWN_ITEMS.map(item => (
                    <button 
                      key={item.label} 
                      className="db-dropdown-item"
                      onClick={() => {
                        setProfileOpen(false);
                        if (item.action === 'settings') {
                          setSettingsOpen(true);
                        } else if (onDropdownItem) {
                          onDropdownItem(item.label, item.tab);
                        }
                      }}
                    >
                      {item.icon}{item.label}
                    </button>
                  ))}
                  <div className="db-dropdown-divider" />
                  <button className="db-dropdown-item db-dropdown-item--danger" onClick={onLogout}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ══ MAIN PANEL (tab content rendered here) ══════════ */}
      <main className="db-main">
        {children}
      </main>

      {/* ══ MOBILE BOTTOM NAV (hidden on desktop) ═══════════ */}
      <nav className="db-bottom-nav" aria-label="Main navigation">
        {visibleNav.map(item => (
          <button
            key={item.label}
            className={
              'db-bnav-item' +
              ((item.tab && activeTab === item.tab) || (item.activeKey && activeTab === item.activeKey)
                ? ' db-bnav-item--active' : '')
            }
            onClick={() => {
              if (item.tab)   onTabChange(item.tab);
              if (item.route) onRoute(item.route);
            }}
            aria-label={item.label}
            aria-current={
              (item.tab && activeTab === item.tab) || (item.activeKey && activeTab === item.activeKey)
                ? 'page' : undefined
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ══ DESKTOP SIDEBAR (hidden on mobile) ══════════════ */}
      <nav className="db-sidebar" aria-label="Main navigation">

        {/* Brand header — desktop only */}
        <div className="db-sidebar-brand">
          <img src={cdnLogo} alt="CDN" className="db-sidebar-brand-logo" />
          <div className="db-sidebar-brand-text">
            <span className="db-sidebar-brand-name">CDN</span>
            <span className="db-sidebar-brand-sub">E-Portal</span>
          </div>
        </div>

        <div className="db-sidebar-inner">
          {NAV_GROUPS.filter(g => !g.role || user?.role === g.role).map(group => (
            <div key={group.group} className="db-sidebar-group">
              <p className="db-sidebar-group-label">{group.group}</p>
              {group.items
                .filter(item => !item.role || user?.role === item.role)
                .map(item => {
                  const isActive =
                    (item.tab && activeTab === item.tab) ||
                    (item.activeKey && activeTab === item.activeKey);
                  return (
                    <button
                      key={item.label}
                      className={'db-sidebar-item' + (isActive ? ' db-sidebar-item--active' : '')}
                      onClick={() => {
                        if (item.tab)   onTabChange(item.tab);
                        if (item.route) onRoute(item.route);
                      }}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className="db-sidebar-item-icon">{item.icon}</span>
                      <span className="db-sidebar-item-label">{item.label}</span>
                    </button>
                  );
                })}
            </div>
          ))}
        </div>

        {/* Bottom user strip */}
        <div className="db-sidebar-footer">
          <div className="db-sidebar-avatar">
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="db-sidebar-user">
            <p className="db-sidebar-user-name">{user?.name?.split(' ')[0] ?? 'User'}</p>
            <p className="db-sidebar-user-role">{user?.role ?? 'Member'}</p>
          </div>
        </div>
      </nav>

      {/* ══ FLOATING CHATBOT FAB ════════════════════════════ */}
      {!chatOpen && (
        <button className="db-chat-fab" onClick={() => setChatOpen(true)} aria-label="Open CDN Assistant">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            <path d="M8 10h8M8 14h5" />
          </svg>
          <span className="db-chat-fab-label">Ask CDN</span>
        </button>
      )}

      {/* ══ CHATBOT MODAL ═══════════════════════════════════ */}
      {chatOpen && (
        <div className="db-chat-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) setChatOpen(false); }}>
          <div className="db-chat-panel" role="dialog" aria-label="CDN Portal Assistant">

            <div className="db-chat-header">
              <div className="db-chat-header-left">
                <div className="db-chat-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                </div>
                <div>
                  <p className="db-chat-title">CDN Assistant</p>
                  <p className="db-chat-status"><span className="db-chat-online" />Online</p>
                </div>
              </div>
              <button className="db-chat-close" onClick={() => setChatOpen(false)} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6"  y2="18" />
                  <line x1="6"  y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="db-chat-prompts">
              {['Check fines', 'OSAS records', 'Admission info', 'Login help'].map(p => (
                <button key={p} className="db-chat-prompt" onClick={() => setChatInput(p)}>{p}</button>
              ))}
            </div>

            <div className="db-chat-messages">
              {chatMessages.map((msg, i) => (
                <div key={i} className={'db-chat-msg db-chat-msg--' + msg.from}>
                  {msg.from === 'bot' && (
                    <div className="db-chat-msg-avatar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="db-chat-bubble">{msg.text}</div>
                </div>
              ))}
              {chatLoading && (
                <div className="db-chat-msg db-chat-msg--bot">
                  <div className="db-chat-msg-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                  </div>
                  <div className="db-chat-bubble db-chat-typing">
                    <span /><span /><span />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form className="db-chat-input-row"
              onSubmit={(e) => { e.preventDefault(); sendChat(); }}>
              <input
                type="text"
                className="db-chat-input"
                placeholder="Ask about fines, OSAS, admissions…"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                autoFocus
              />
              <button type="submit" className="db-chat-send" aria-label="Send">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ══ SETTINGS DRAWER ═════════════════════════════════ */}
      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={user}
      />

    </div>
  );
};

export default DashboardShell;
