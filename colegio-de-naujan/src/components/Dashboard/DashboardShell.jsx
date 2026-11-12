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
import { useRef, useState, useEffect, useCallback } from 'react';
import cdnLogo           from '../../assets/images/logo.png';
import bagongPilipinas   from '../../assets/images/bagong-pilipinas-seeklogo.png';
import {
  NAV_ITEMS, NAV_GROUPS, DROPDOWN_ITEMS, BANNERS,
  SYSTEMS, getDayDate, getGreeting,
} from './constants';
import SettingsDrawer from './SettingsPage';
import { sendToGroq } from '../../lib/groqChat';
import { supabase } from '../../lib/supabase';
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
  const govRef      = useRef(null);

  const [profileOpen,     setProfileOpen]     = useState(false);
  const [notifOpen,       setNotifOpen]       = useState(false);
  const [govDropOpen,     setGovDropOpen]     = useState(false);
  const [chatOpen,        setChatOpen]        = useState(false);
  const [settingsOpen,    setSettingsOpen]    = useState(false);

  /* ── Real-time notifications ── */
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);

  const addNotif = useCallback((notif) => {
    setNotifications(prev => {
      const updated = [notif, ...prev].slice(0, 50); // keep latest 50
      return updated;
    });
    setUnreadCount(n => n + 1);
  }, []);

  const timeAgo = (ts) => {
    const d = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (d < 60)    return d + 's ago';
    if (d < 3600)  return Math.floor(d / 60) + 'm ago';
    if (d < 86400) return Math.floor(d / 3600) + 'h ago';
    return Math.floor(d / 86400) + 'd ago';
  };

  useEffect(() => {
    // ── concern_submissions: new concern submitted
    const ch1 = supabase.channel('notif_concerns')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'concern_submissions' }, (payload) => {
        const r = payload.new;
        addNotif({
          id: `concern_${r.id}`,
          text: `New concern submitted: "${r.subject}"`,
          sub: `Ref: ${r.reference_no} · ${r.category?.replace(/_/g, ' ')}`,
          dot: '#C8102E',
          ts: r.created_at || new Date().toISOString(),
          tab: 'governance', subtab: 'accountability',
        });
      })
      .subscribe();

    // ── concern_submissions: status updated
    const ch2 = supabase.channel('notif_concern_update')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'concern_submissions' }, (payload) => {
        const r = payload.new;
        if (r.status !== payload.old?.status) {
          addNotif({
            id: `concern_upd_${r.id}_${Date.now()}`,
            text: `Concern ${r.reference_no} → ${r.status?.replace(/_/g, ' ')}`,
            sub: `${r.subject}`,
            dot: '#7c3aed',
            ts: r.updated_at || new Date().toISOString(),
            tab: 'governance', subtab: 'accountability',
          });
        }
      })
      .subscribe();

    // ── consultations: new consultation created or published
    const ch3 = supabase.channel('notif_consultations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'consultations' }, (payload) => {
        const r = payload.new;
        addNotif({
          id: `consult_${r.id}`,
          text: `New consultation created: "${r.title}"`,
          sub: `Type: ${r.type} · Status: ${r.status}`,
          dot: '#C8960C',
          ts: r.created_at || new Date().toISOString(),
          tab: 'governance', subtab: 'participation',
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'consultations' }, (payload) => {
        const r = payload.new;
        if (r.status === 'published' && payload.old?.status !== 'published') {
          addNotif({
            id: `consult_pub_${r.id}`,
            text: `Consultation published: "${r.title}"`,
            sub: 'Now visible to the public',
            dot: '#10813f',
            ts: new Date().toISOString(),
            tab: 'governance', subtab: 'participation',
          });
        }
      })
      .subscribe();

    // ── consultation_responses: new survey response
    const ch4 = supabase.channel('notif_responses')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'consultation_responses' }, (payload) => {
        addNotif({
          id: `resp_${Date.now()}`,
          text: 'New survey response received',
          sub: 'A respondent submitted answers',
          dot: '#C8960C',
          ts: new Date().toISOString(),
          tab: 'governance', subtab: 'participation',
        });
      })
      .subscribe();

    // ── governance_documents: new doc or published
    const ch5 = supabase.channel('notif_documents')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'governance_documents' }, (payload) => {
        const r = payload.new;
        addNotif({
          id: `doc_${r.id}`,
          text: `New document: "${r.title}"`,
          sub: `Category: ${r.category?.replace(/_/g, ' ')} · ${r.status}`,
          dot: '#002280',
          ts: r.created_at || new Date().toISOString(),
          tab: 'governance', subtab: 'transparency',
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'governance_documents' }, (payload) => {
        const r = payload.new;
        if (r.status === 'published' && payload.old?.status !== 'published') {
          addNotif({
            id: `doc_pub_${r.id}`,
            text: `Document published: "${r.title}"`,
            sub: 'Now visible on the public portal',
            dot: '#10813f',
            ts: r.published_at || new Date().toISOString(),
            tab: 'governance', subtab: 'transparency',
          });
        }
      })
      .subscribe();

    // ── portal_sessions: new login
    const ch6 = supabase.channel('notif_sessions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'portal_sessions' }, (payload) => {
        const r = payload.new;
        addNotif({
          id: `session_${r.id}`,
          text: `${r.full_name || r.user_id} signed in`,
          sub: `${r.role || 'User'} · ${r.course || ''}`.trim().replace(/·\s*$/, ''),
          dot: '#10813f',
          ts: r.login_at || new Date().toISOString(),
          tab: 'overview',
        });
      })
      .subscribe();

    // ── announcements: new announcement
    const ch7 = supabase.channel('notif_announcements')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' }, (payload) => {
        const r = payload.new;
        addNotif({
          id: `ann_${r.id}`,
          text: `Announcement posted: "${r.title}"`,
          sub: `Type: ${r.type} · ${r.is_active ? 'Active' : 'Draft'}`,
          dot: '#002280',
          ts: r.created_at || new Date().toISOString(),
          tab: 'announcements',
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
      supabase.removeChannel(ch3);
      supabase.removeChannel(ch4);
      supabase.removeChannel(ch5);
      supabase.removeChannel(ch6);
      supabase.removeChannel(ch7);
    };
  }, [addNotif]);
  const [chatInput,     setChatInput]     = useState('');
  const [chatMessages,  setChatMessages]  = useState([
    { from: 'bot', text: "Hi! I'm the CDN Portal Assistant. How can I help you today?" },
  ]);

  /* close dropdowns on outside click */
  useEffect(() => {
    const h = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
      if (govRef.current     && !govRef.current.contains(e.target))     setGovDropOpen(false);
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
                onClick={() => { setNotifOpen(v => !v); setProfileOpen(false); if (!notifOpen) setUnreadCount(0); }}
                aria-label="Notifications"
                style={{ position:'relative' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                {unreadCount > 0
                  ? <span style={{ position:'absolute', top:4, right:4, minWidth:16, height:16, background:'#C8102E', color:'#fff', fontSize:'.6rem', fontWeight:900, borderRadius:999, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px', border:'1.5px solid #001158' }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  : <span className="db-notif-dot" />
                }
              </button>
              {notifOpen && (
                <div className="db-dropdown db-notif-panel" style={{ minWidth: 320 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'.9rem 1rem .5rem' }}>
                    <p className="db-dropdown-head" style={{ margin:0 }}>Notifications</p>
                    <div style={{ display:'flex', gap:6 }}>
                      {notifications.length > 0 && (
                        <button
                          onClick={() => { setNotifications([]); setUnreadCount(0); }}
                          style={{ fontSize:'.68rem', fontWeight:700, color:'#94a3b8', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}
                        >Clear all</button>
                      )}
                    </div>
                  </div>

                  {notifications.length === 0 ? (
                    <div style={{ padding:'1.5rem 1rem', textAlign:'center' }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{ marginBottom:8 }}>
                        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 01-3.46 0"/>
                      </svg>
                      <p style={{ margin:0, fontSize:'.82rem', color:'#94a3b8', fontWeight:600 }}>No notifications yet</p>
                      <p style={{ margin:'4px 0 0', fontSize:'.72rem', color:'#cbd5e1' }}>Activity will appear here in real-time</p>
                    </div>
                  ) : (
                    <div style={{ maxHeight:360, overflowY:'auto' }}>
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="db-notif-item"
                          onClick={() => {
                            setNotifOpen(false);
                            if (n.tab) {
                              window.__govSubTab = n.subtab || null;
                              if (n.tab === 'governance' && n.subtab) {
                                window.dispatchEvent(new CustomEvent('gov-subtab', { detail: n.subtab }));
                              }
                            }
                          }}
                          style={{ cursor: n.tab ? 'pointer' : 'default', transition:'background .12s' }}
                          onMouseEnter={e => { if (n.tab) e.currentTarget.style.background = '#f8fafc'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                        >
                          <span className="db-notif-item-dot" style={{ background: n.dot, flexShrink:0, marginTop:4 }} />
                          <div style={{ flex:1, minWidth:0 }}>
                            <p className="db-notif-item-text" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.text}</p>
                            {n.sub && <p style={{ margin:'2px 0 0', fontSize:'.7rem', color:'#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.sub}</p>}
                            <p className="db-notif-item-time">{timeAgo(n.ts)}</p>
                          </div>
                          {n.tab && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2.5" style={{ flexShrink:0 }}>
                              <path d="M9 18l6-6-6-6"/>
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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

      {/* ══ TOP NAV BAR ═════════════════════════════════════ */}
      <nav className="db-topnav" aria-label="Main navigation">
        <div className="db-topnav-inner">
          {NAV_GROUPS.filter(g => !g.role || user?.role === g.role).flatMap(g => g.items)
            .filter(item => !item.role || user?.role === item.role)
            .map(item => {
              const isActive =
                (item.tab && activeTab === item.tab) ||
                (item.activeKey && activeTab === item.activeKey);

              /* ── Governance dropdown ── */
              if (item.tab === 'governance') {
                const GOV_ITEMS = [
                  { key: 'transparency',   label: 'Documents',      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 13h8v1.5H8V13zm0 3h5v1.5H8V16z"/></svg> },
                  { key: 'accountability', label: 'Concerns',        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg> },
                  { key: 'participation',  label: 'Consultations',   icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg> },
                ];
                const btnLeft = govRef.current?.getBoundingClientRect()?.left ?? 0;
                return (
                  <div key="governance" ref={govRef} style={{ position: 'relative' }}>
                    <button
                      className={'db-topnav-item' + (isActive ? ' db-topnav-item--active' : '')}
                      onClick={() => setGovDropOpen(v => !v)}
                      aria-haspopup="true"
                      aria-expanded={govDropOpen}
                    >
                      <span className="db-topnav-icon">{item.icon}</span>
                      <span>{item.label}</span>
                      <svg style={{ width:11, height:11, marginLeft:3, transition:'transform .15s', transform: govDropOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    {govDropOpen && (
                      <div style={{
                        position: 'fixed',
                        top: '100px',
                        left: btnLeft,
                        background: '#fff', border: '1px solid #e2e8f0',
                        borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.15)',
                        zIndex: 500, minWidth: 180, overflow: 'hidden',
                        animation: 'dbDropIn .15s ease',
                      }}>
                        {GOV_ITEMS.map((g, i) => (
                          <button
                            key={g.key}
                            onClick={() => {
                              setGovDropOpen(false);
                              // Store the desired subtab so GovernancePage reads it on mount
                              window.__govSubTab = g.key;
                              onTabChange('governance');
                              // Also dispatch for already-mounted case (switching within governance)
                              window.dispatchEvent(new CustomEvent('gov-subtab', { detail: g.key }));
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 9,
                              width: '100%', padding: '10px 14px',
                              border: 'none', background: 'none',
                              fontSize: '.83rem', fontWeight: 600,
                              color: '#374151', cursor: 'pointer',
                              fontFamily: 'inherit', textAlign: 'left',
                              borderBottom: i < GOV_ITEMS.length - 1 ? '1px solid #f1f5f9' : 'none',
                              transition: 'background .12s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <span style={{ color: '#002280' }}>{g.icon}</span>
                            {g.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={item.label}
                  className={'db-topnav-item' + (isActive ? ' db-topnav-item--active' : '')}
                  onClick={() => {
                    if (item.tab)   onTabChange(item.tab);
                    if (item.route) onRoute(item.route);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="db-topnav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}

          {/* Spacer pushes search to the right */}
          <div className="db-topnav-spacer" />

          {/* Search — docked right in the nav bar */}
          <div className="db-topnav-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search…"
              onKeyDown={e => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  window.dispatchEvent(new CustomEvent('db-search', { detail: e.target.value.trim() }));
                }
              }}
            />
          </div>
        </div>
      </nav>

      {/* ══ MAIN PANEL ══════════════════════════════════════ */}
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
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
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
                <button
                  key={p}
                  className="db-chat-prompt"
                  onClick={() => {
                    setChatInput(p);
                    setTimeout(() => {
                      const text = p.trim();
                      if (!text) return;
                      const userMsg = { from: 'user', text };
                      setChatMessages(m => [...m, userMsg]);
                      setChatInput('');
                      setChatLoading(true);
                      const history = [...chatMessages, userMsg]
                        .slice(-6)
                        .map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }));
                      sendToGroq(history)
                        .then(reply => setChatMessages(m => [...m, { from: 'bot', text: reply }]))
                        .catch(() => setChatMessages(m => [...m, { from: 'bot', text: 'Sorry, the assistant is temporarily unavailable.' }]))
                        .finally(() => setChatLoading(false));
                    }, 0);
                  }}
                >{p}</button>
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
