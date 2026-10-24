import { useState, useEffect, useRef, useCallback } from 'react';
import cdnLogo    from '../../assets/images/logo.png';
import bagongLogo from '../../assets/images/bagong-pilipinas-seeklogo.png';
import '../../styles/dashboard.css';
import { recordLogoutSession, recordSystemVisit } from '../../lib/auth';
import { sendToGroq } from '../../lib/groqChat';
import { fetchAnnouncements } from '../../lib/announcements';
import { supabase } from '../../lib/supabase';

/* ─── Constants ─────────────────────────────────────────── */
const PAGEVIEW_KEY  = 'cdn_pageviews';
const ANALYTICS_KEY = 'cdn_analytics';

const getAnalytics = () => {
  try { return JSON.parse(localStorage.getItem(ANALYTICS_KEY)) || {}; }
  catch { return {}; }
};
const recordVisit = (id, label) => {
  const a = getAnalytics();
  a[id] = (a[id] || 0) + 1;
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(a));
  const views = (() => { try { return JSON.parse(localStorage.getItem(PAGEVIEW_KEY)) || []; } catch { return []; } })();
  views.unshift({ id, label, ts: Date.now() });
  localStorage.setItem(PAGEVIEW_KEY, JSON.stringify(views.slice(0, 200)));
};

const SERVICES = [
  { id: 'csc',       label: 'Student Fines', sub: 'Check and settle your outstanding fines', url: 'https://student-fines-hub-vf9z.vercel.app/', color: '#002280', bg: '#eef1fb' },
  { id: 'osas',      label: 'OSAS Records',  sub: 'View your conduct and violation records', url: 'https://osas-sys.duckdns.org/',              color: '#C8102E', bg: '#fdf0f2' },
  { id: 'admission', label: 'Admissions',    sub: 'Online enrollment and admission portal',  url: 'https://ecnesis.duckdns.org/',               color: '#C8960C', bg: '#fdf8ec' },
];
const SVC_ICONS = {
  csc:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4M7 8h10M7 12h6"/></svg>,
  osas:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
  admission: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
};
const NAV_ICONS = {
  home:          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  history:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  account:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  announcements: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 17H2a3 3 0 000 6h20a3 3 0 000-6z"/><path d="M12 17V3"/><path d="M5 10l7-7 7 7"/></svg>,
};

const STUDENT_NAV_GROUPS = [
  { group: 'Portal',  items: [{ key: 'home', label: 'Home' }, { key: 'history', label: 'History' }, { key: 'announcements', label: 'Announcements' }] },
  { group: 'Account', items: [{ key: 'account', label: 'My Profile' }] },
];
const MOBILE_NAV = [{ key: 'home', label: 'Home' }, { key: 'history', label: 'History' }, { key: 'announcements', label: 'Alerts' }, { key: 'account', label: 'Profile' }];
const SVC_GRADIENTS   = ['linear-gradient(130deg,#002280,#0044cc)', 'linear-gradient(130deg,#C8102E,#9b0921)', 'linear-gradient(130deg,#b45309,#C8960C)'];
const SVC_TAGS        = ['CSC Services', 'OSAS Services', 'Admissions'];
const NOTIF_STATIC = [];

const ANN_TYPE = {
  info:    { color: '#002280', bg: '#eef1fb', border: '#c7d3f7', label: 'Info' },
  warning: { color: '#b45309', bg: '#fdf8ec', border: '#fcd34d', label: 'Warning' },
  urgent:  { color: '#C8102E', bg: '#fff0f2', border: '#fecdd3', label: 'Urgent' },
  event:   { color: '#10813f', bg: '#edf7f1', border: '#86efac', label: 'Event' },
};

const timeAgo = (ts) => {
  const d = Math.floor((Date.now() - ts) / 1000);
  if (d < 60)    return d + 's ago';
  if (d < 3600)  return Math.floor(d / 60) + 'm ago';
  if (d < 86400) return Math.floor(d / 3600) + 'h ago';
  return Math.floor(d / 86400) + 'd ago';
};
const getGreeting = () => { const h = new Date().getHours(); if (h < 12) return 'Good morning'; if (h < 18) return 'Good afternoon'; return 'Good evening'; };
const getDayDate  = () => new Date().toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' });

/* ═══════════════════════════════════════════════════════════
   STUDENT DASHBOARD — matches Admin DashboardShell design
   ═══════════════════════════════════════════════════════════ */
export default function StudentDashboard({ user, onLogout }) {
  const [tab,          setTab]          = useState('home');
  const [analytics,    setAnalytics]    = useState(getAnalytics);
  const [recentVisits, setRecentVisits] = useState([]);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [chatOpen,     setChatOpen]     = useState(false);
  const [chatInput,    setChatInput]    = useState('');
  const [chatLoading,  setChatLoading]  = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { from: 'bot', text: "Hi! I'm the CDN Portal Assistant. How can I help you today?" },
  ]);
  const [announcements,   setAnnouncements]   = useState([]);
  const [unreadCount,     setUnreadCount]     = useState(0);
  const [annSeenKey]                          = useState(() => `cdn_ann_seen_${user?.studentNumber || 'student'}`);
  const [toasts,          setToasts]          = useState([]); // in-app toast notifications
  const profileRef = useRef(null);
  const notifRef   = useRef(null);
  const chatEndRef = useRef(null);

  /* ── Helper: audience match check ────────────────────── */
  const matchesStudent = useCallback((ann) => {
    const c = user?.course    || null;
    const y = user?.yearLevel ?? null;
    const courseOk = !ann.target_courses?.length || (c && ann.target_courses.map(x => x.toUpperCase()).includes(c.toUpperCase()));
    const yearOk   = !ann.target_year_levels?.length || (y != null && ann.target_year_levels.includes(String(y)));
    return courseOk && yearOk;
  }, [user?.course, user?.yearLevel]);

  /* ── Helper: show in-app toast ─────────────────────────── */
  const showToast = useCallback((ann) => {
    const id = ann.id + '_toast_' + Date.now();
    setToasts(t => [{ ...ann, _toastId: id }, ...t].slice(0, 4)); // max 4 stacked
    // Auto-dismiss after 7 s
    setTimeout(() => setToasts(t => t.filter(x => x._toastId !== id)), 7000);
  }, []);

  /* ── Helper: request + send browser notification ───────── */
  const sendBrowserNotif = useCallback((ann) => {
    if (!('Notification' in window)) return;
    const send = () => {
      new Notification('📢 CDN Announcement', {
        body: ann.title + '\n' + ann.body.slice(0, 80) + (ann.body.length > 80 ? '…' : ''),
        icon: '/favicon.ico',
        tag:  ann.id,
        requireInteraction: ann.type === 'urgent',
      });
    };
    if (Notification.permission === 'granted') { send(); }
    else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(p => { if (p === 'granted') send(); });
    }
  }, []);

  /* ── Supabase Realtime subscription ────────────────────── */
  useEffect(() => {
    const channel = supabase
      .channel('announcements-realtime')
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'announcements',
      }, (payload) => {
        const ann = payload.new;
        if (!ann.is_active) return;            // skip inactive
        if (!matchesStudent(ann)) return;      // skip if not for this student
        // Add to announcements list
        setAnnouncements(prev => [ann, ...prev]);
        // Bump unread count
        setUnreadCount(n => n + 1);
        // Show in-app toast
        showToast(ann);
        // Show browser notification
        sendBrowserNotif(ann);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [matchesStudent, showToast, sendBrowserNotif]);

  /* ── Request browser notification permission on mount ──── */
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      // Delay 3s so it doesn't feel intrusive on first load
      const t = setTimeout(() => Notification.requestPermission(), 3000);
      return () => clearTimeout(t);
    }
  }, []);


  /* load announcements + poll every 60s */
  useEffect(() => {
    const loadAnn = async () => {
      try {
        const data = await fetchAnnouncements({
          course:     user?.course     || null,
          yearLevel:  user?.yearLevel  ?? null,
        });
        setAnnouncements(data);
        const seenRaw = localStorage.getItem(annSeenKey);
        const seenIds = seenRaw ? JSON.parse(seenRaw) : [];
        const unseen  = data.filter(a => !seenIds.includes(a.id));
        setUnreadCount(unseen.length);
      } catch (e) { console.warn('[Announcements]', e.message); }
    };
    loadAnn();
    const iv = setInterval(loadAnn, 60000);
    return () => clearInterval(iv);
  }, [annSeenKey, user?.course, user?.yearLevel]);

  const markAllSeen = () => {
    const ids = announcements.map(a => a.id);
    localStorage.setItem(annSeenKey, JSON.stringify(ids));
    setUnreadCount(0);
  };

  useEffect(() => {
    const h = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, chatOpen]);
  useEffect(() => { try { setRecentVisits(JSON.parse(localStorage.getItem(PAGEVIEW_KEY)) || []); } catch { setRecentVisits([]); } }, []);

  const displayName = user?.name || user?.username || user?.studentNumber || 'Student';
  const initial     = displayName.charAt(0).toUpperCase();
  const firstName   = displayName.includes(',')
    ? (displayName.split(',')[1]?.trim().split(' ')[0] || displayName.split(',')[0])
    : displayName.split(' ')[0];

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const userMsg = { from: 'user', text };
    setChatMessages(m => [...m, userMsg]); setChatInput(''); setChatLoading(true);
    const history = [...chatMessages, userMsg].slice(-6).map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }));
    try { const reply = await sendToGroq(history); setChatMessages(m => [...m, { from: 'bot', text: reply }]); }
    catch { setChatMessages(m => [...m, { from: 'bot', text: 'Sorry, the assistant is temporarily unavailable.' }]); }
    finally { setChatLoading(false); }
  };
  const sendPrompt = (p) => {
    const userMsg = { from: 'user', text: p };
    setChatMessages(m => [...m, userMsg]); setChatInput(''); setChatLoading(true);
    const history = [...chatMessages, userMsg].slice(-6).map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }));
    sendToGroq(history)
      .then(reply => setChatMessages(m => [...m, { from: 'bot', text: reply }]))
      .catch(() => setChatMessages(m => [...m, { from: 'bot', text: 'Sorry, the assistant is temporarily unavailable.' }]))
      .finally(() => setChatLoading(false));
  };
  const handleOpen = (svc) => {
    window.open(svc.url, '_blank', 'noopener,noreferrer');
    recordVisit(svc.id, svc.label); setAnalytics(getAnalytics());
    const views = (() => { try { return JSON.parse(localStorage.getItem(PAGEVIEW_KEY)) || []; } catch { return []; } })();
    setRecentVisits(views);
    recordSystemVisit(svc.id, svc.label, user?.username ?? user?.studentNumber ?? null);
  };
  const handleLogout = async () => {
    const sessionId = localStorage.getItem('cdn_session');
    await recordLogoutSession(sessionId);
    localStorage.removeItem('cdn_user'); localStorage.removeItem('cdn_session');
    onLogout();
  };

  return (
    <div className="db-root">

      {/* ══ TOPBAR ══════════════════════════════════════════ */}
      <header className="db-topbar">
        <div className="db-topbar-inner">
          <div className="db-topbar-brand">
            <img src={cdnLogo} alt="CDN" className="db-topbar-logo" />
            <div className="db-topbar-wordmark">
              <span className="db-topbar-school">CDN</span>
              <span className="db-topbar-portal">Student Portal</span>
            </div>
          </div>
          <div className="db-topbar-meta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 010 16c-4 0-8-5.37-8-8a8 8 0 0116 0z"/></svg>
            <span>Naujan, Oriental Mindoro</span>
            <span className="db-topbar-sep">·</span>
            <span>{getDayDate()}</span>
          </div>
          <div className="db-topbar-actions">
            {/* Bell */}
            <div className="db-notif-wrap" ref={notifRef}>
              <button className="db-icon-btn" onClick={() => { setNotifOpen(v => !v); setProfileOpen(false); if (!notifOpen) markAllSeen(); }} aria-label="Notifications" style={{ position: 'relative' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                {unreadCount > 0
                  ? <span style={{ position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, background: '#C8102E', color: '#fff', fontSize: '.6rem', fontWeight: 900, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                  : <span className="db-notif-dot"/>
                }
              </button>
              {notifOpen && (
                <div className="db-dropdown db-notif-panel">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0 .5rem' }}>
                    <p className="db-dropdown-head" style={{ margin: 0 }}>Announcements</p>
                    {announcements.length > 0 && (
                      <button onClick={() => { setNotifOpen(false); setTab('announcements'); }} style={{ fontSize: '.68rem', fontWeight: 700, color: '#002280', background: '#eef1fb', border: 'none', borderRadius: 6, padding: '.2rem .55rem', cursor: 'pointer', fontFamily: 'inherit' }}>See all</button>
                    )}
                  </div>
                  {announcements.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', fontSize: '.8rem', color: '#9ca3af' }}>No announcements yet.</div>
                  ) : announcements.slice(0, 5).map((a) => {
                    const cfg = ANN_TYPE[a.type] || ANN_TYPE.info;
                    return (
                      <div key={a.id} className="db-notif-item">
                        <span className="db-notif-item-dot" style={{ background: cfg.color }}/>
                        <div>
                          <p className="db-notif-item-text">{a.title}</p>
                          <p className="db-notif-item-time">{timeAgo(new Date(a.created_at).getTime())}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="db-profile-wrap" ref={profileRef}>
              <button className="db-profile-btn" onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); }} aria-label="Account menu">
                <div className="db-avatar">{initial}</div>
                <div className="db-profile-text">
                  <span className="db-profile-greeting">{getGreeting()}, <strong>{firstName}</strong></span>
                  <span className="db-profile-role">Student</span>
                </div>
                <svg className="db-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {profileOpen && (
                <div className="db-dropdown db-profile-panel">
                  <div className="db-profile-panel-header">
                    <div className="db-avatar db-avatar--lg">{initial}</div>
                    <div><p className="db-pp-name">{displayName}</p><p className="db-pp-role">Student · {user?.course || 'CDN'}</p></div>
                  </div>
                  <div className="db-dropdown-divider"/>
                  <button className="db-dropdown-item" onClick={() => { setProfileOpen(false); setTab('account'); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>My Profile
                  </button>
                  <button className="db-dropdown-item" onClick={() => { setProfileOpen(false); setTab('history'); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Visit History
                  </button>
                  <div className="db-dropdown-divider"/>
                  <button className="db-dropdown-item db-dropdown-item--danger" onClick={() => { setProfileOpen(false); setShowConfirm(true); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ══ MAIN ════════════════════════════════════════════ */}
      <main className="db-main">

        {/* HERO */}
        <div className="db-hero">
          <div className="db-hero-noise" aria-hidden="true"/>
          <div className="db-hero-stripe" aria-hidden="true"/>
          <div className="db-hero-inner">
            <div className="db-hero-left">
              <div className="db-hero-badge"><span className="db-hero-badge-dot"/>Student Portal Active</div>
              <h1 className="db-hero-greeting">{getGreeting()},<br/><span className="db-hero-name">{firstName}</span></h1>
              <p className="db-hero-sub">Welcome to <strong>CDN Student Portal</strong> — access your academic services and records.</p>
              <div className="db-hero-pills">
                <span className="db-hero-pill">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {user?.course || 'CDN Student'}
                </span>
                {user?.yearLevel && <span className="db-hero-pill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/></svg>Year {user.yearLevel}</span>}
                <span className="db-hero-pill db-hero-pill--gold">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  AY 2026-2027
                </span>
              </div>
            </div>
            <img src={bagongLogo} alt="Bagong Pilipinas" className="db-hero-bp" style={{ width: 72, height: 72 }}/>
          </div>
        </div>

        {/* ══ HOME TAB ══ */}
        {tab === 'home' && <>
          {/* Services panel */}
          <div className="db-panel db-services-panel">
            <div className="db-panel-header">
              <div className="db-panel-header-left">
                <div className="db-panel-icon db-panel-icon--blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                </div>
                <div><p className="db-panel-title">My Services</p><p className="db-panel-sub">{SERVICES.length} systems connected</p></div>
              </div>
              <span className="db-badge-pill">Quick Access</span>
            </div>
            <div className="db-sys-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {SERVICES.map(svc => (
                <button key={svc.id} onClick={() => handleOpen(svc)} className="db-sys-card" style={{ '--sc': svc.color, '--sc-bg': svc.bg }}>
                  <div className="db-sys-icon-wrap" style={{ background: svc.bg, color: svc.color }}>{SVC_ICONS[svc.id]}</div>
                  <div className="db-sys-info"><p className="db-sys-label">{svc.label}</p><p className="db-sys-sub">{svc.sub}</p></div>
                  <div className="db-sys-footer">
                    {analytics[svc.id] > 0 && (
                      <div className="db-sys-visits" style={{ color: svc.color }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        {analytics[svc.id]}
                      </div>
                    )}
                    <div className="db-sys-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
                  </div>
                </button>
              ))}
            </div>
          </div>


          {/* Recent Activity */}
          {recentVisits.length > 0 && (
            <div className="db-panel">
              <div className="db-panel-header">
                <div className="db-panel-header-left">
                  <div className="db-panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
                  <div><p className="db-panel-title">Recent Activity</p><p className="db-panel-sub">Your latest portal visits</p></div>
                </div>
                <button onClick={() => setTab('history')} style={{ fontSize: '.75rem', fontWeight: 700, color: '#002280', background: '#eef1fb', border: 'none', borderRadius: 8, padding: '.3rem .8rem', cursor: 'pointer', fontFamily: 'inherit' }}>See all</button>
              </div>
              {recentVisits.slice(0, 4).map((v, i) => {
                const svc = SERVICES.find(s => s.id === v.id);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '.85rem 1.25rem', borderBottom: i < Math.min(recentVisits.length, 4) - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: svc?.color || '#9ca3af', flexShrink: 0 }}/>
                    <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: svc?.bg || '#f3f4f6', color: svc?.color || '#6b7280' }}>
                      <span style={{ width: 16, height: 16, display: 'flex' }}>{SVC_ICONS[svc?.id]}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}><p style={{ fontSize: '.83rem', fontWeight: 700, color: '#0f1724', margin: 0 }}>{v.label}</p></div>
                    <span style={{ fontSize: '.68rem', fontWeight: 600, color: '#9ca3af', flexShrink: 0 }}>{timeAgo(v.ts)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>}

        {/* ══ ANNOUNCEMENTS TAB ══ */}
        {tab === 'announcements' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="db-panel">
              <div className="db-panel-header">
                <div className="db-panel-header-left">
                  <div className="db-panel-icon db-panel-icon--blue">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 17H2a3 3 0 000 6h20a3 3 0 000-6z"/><path d="M12 17V3"/><path d="M5 10l7-7 7 7"/></svg>
                  </div>
                  <div><p className="db-panel-title">Announcements</p><p className="db-panel-sub">{announcements.length} active broadcast{announcements.length !== 1 ? 's' : ''}</p></div>
                </div>
                <span className="db-badge-pill">From Admin</span>
              </div>
              {announcements.length === 0 ? (
                <div className="db-no-results">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 17H2a3 3 0 000 6h20a3 3 0 000-6z"/><path d="M12 17V3"/><path d="M5 10l7-7 7 7"/></svg>
                  <p>No announcements yet</p>
                  <p style={{ fontSize: '.78rem', color: '#9ca3af' }}>Check back later for school announcements.</p>
                </div>
              ) : announcements.map((ann, i) => {
                const cfg = ANN_TYPE[ann.type] || ANN_TYPE.info;
                return (
                  <div key={ann.id}
                    style={{ padding: '1.1rem 1.25rem', borderBottom: i < announcements.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: cfg.bg, color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {ann.type === 'event'
                            ? <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>
                            : <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
                          }
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', marginBottom: 6 }}>
                          <p style={{ fontSize: '.9rem', fontWeight: 800, color: '#0f1724', margin: 0 }}>{ann.title}</p>
                          <span style={{ fontSize: '.62rem', fontWeight: 800, padding: '.2rem .6rem', borderRadius: 999, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, textTransform: 'uppercase', letterSpacing: '.04em', flexShrink: 0 }}>
                            {cfg.label}
                          </span>
                        </div>
                        <p style={{ fontSize: '.85rem', color: '#374151', lineHeight: 1.6, margin: '0 0 8px' }}>{ann.body}</p>
                        <p style={{ fontSize: '.68rem', color: '#9ca3af', margin: 0 }}>
                          Posted by <strong style={{ color: '#6b7280' }}>{ann.created_by || 'Admin'}</strong> · {timeAgo(new Date(ann.created_at).getTime())}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ HISTORY TAB ══ */}
        {tab === 'history' && (

          <div className="db-panel">
            <div className="db-panel-header">
              <div className="db-panel-header-left">
                <div className="db-panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
                <div><p className="db-panel-title">Visit History</p><p className="db-panel-sub">{recentVisits.length} recorded visit{recentVisits.length !== 1 ? 's' : ''}</p></div>
              </div>
              {recentVisits.length > 0 && (
                <button onClick={() => { localStorage.removeItem(PAGEVIEW_KEY); setRecentVisits([]); }}
                  style={{ fontSize: '.73rem', fontWeight: 700, color: '#C8102E', background: '#fff0f2', border: '1px solid #fecdd3', borderRadius: 8, padding: '.3rem .85rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Clear All
                </button>
              )}
            </div>
            {recentVisits.length === 0 ? (
              <div className="db-no-results">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <p>No visits yet</p><p style={{ fontSize: '.78rem', color: '#9ca3af' }}>Your service visits will appear here.</p>
              </div>
            ) : recentVisits.map((v, i) => {
              const svc = SERVICES.find(s => s.id === v.id);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', borderBottom: i < recentVisits.length - 1 ? '1px solid #f3f4f6' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f7f8fc'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: svc?.color || '#9ca3af', flexShrink: 0 }}/>
                  <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: svc?.bg || '#f3f4f6', color: svc?.color || '#6b7280' }}>
                    <span style={{ width: 18, height: 18, display: 'flex' }}>{SVC_ICONS[svc?.id]}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '.88rem', fontWeight: 700, color: '#0f1724', margin: '0 0 2px' }}>{v.label}</p>
                    <p style={{ fontSize: '.71rem', color: '#9ca3af', margin: 0 }}>{new Date(v.ts).toLocaleDateString('en-PH', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span style={{ fontSize: '.65rem', fontWeight: 800, padding: '.25rem .65rem', borderRadius: 999, color: svc?.color || '#6b7280', background: svc?.bg || '#f3f4f6', flexShrink: 0 }}>{timeAgo(v.ts)}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ ACCOUNT TAB ══ */}
        {tab === 'account' && <>


          {/* Student Info */}
          <div className="db-panel">
            <div className="db-panel-header">
              <div className="db-panel-header-left">
                <div className="db-panel-icon db-panel-icon--blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                <p className="db-panel-title">Student Information</p>
              </div>
            </div>
            {[
              { label: 'Full Name',      value: displayName,                                     color: '#002280', bg: '#eef1fb' },
              { label: 'Student Number', value: user?.studentNumber || '—',                      color: '#7c3aed', bg: '#f5f0ff' },
              { label: 'Course',         value: user?.course || '—',                             color: '#C8960C', bg: '#fdf8ec' },
              { label: 'Year Level',     value: user?.yearLevel ? `Year ${user.yearLevel}` : '—', color: '#10813f', bg: '#edf7f1' },
              { label: 'Status',         value: user?.enrollmentStatus ? user.enrollmentStatus.charAt(0).toUpperCase() + user.enrollmentStatus.slice(1) : 'Enrolled', color: '#0891b2', bg: '#ecf8fb' },
              { label: 'Academic Year',  value: 'AY 2026 – 2027',                                color: '#374151', bg: '#f3f4f6' },
            ].map((row, i, arr) => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: row.bg, color: row.color }}>
                  <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/></svg>
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '.68rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.04em', margin: '0 0 2px' }}>{row.label}</p>
                  <p style={{ fontSize: '.88rem', fontWeight: 700, color: '#0f1724', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Access */}
          <div className="db-panel">
            <div className="db-panel-header">
              <div className="db-panel-header-left">
                <div className="db-panel-icon db-panel-icon--blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></div>
                <p className="db-panel-title">Quick Access</p>
              </div>
            </div>
            {SERVICES.map((svc, i) => (
              <button key={svc.id} onClick={() => handleOpen(svc)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', border: 'none', background: 'none', borderBottom: i < SERVICES.length - 1 ? '1px solid #f3f4f6' : 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'background .12s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f7f8fc'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: svc.bg, color: svc.color }}>
                  <span style={{ width: 18, height: 18, display: 'flex' }}>{SVC_ICONS[svc.id]}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '.88rem', fontWeight: 700, color: '#0f1724', margin: '0 0 2px' }}>{svc.label}</p>
                  <p style={{ fontSize: '.72rem', color: '#9ca3af', margin: 0 }}>{analytics[svc.id] || 0} visits</p>
                </div>
                <svg style={{ width: 14, height: 14, color: '#d1d5db', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </button>
            ))}
          </div>

          {/* Sign out */}
          <div className="db-panel">
            <button onClick={() => setShowConfirm(true)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'background .12s', borderRadius: 14 }}
              onMouseEnter={e => e.currentTarget.style.background = '#fff0f2'}
              onMouseLeave={e => e.currentTarget.style.background = ''}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fff0f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg style={{ width: 18, height: 18, color: '#C8102E' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </div>
              <div><p style={{ fontSize: '.88rem', fontWeight: 700, color: '#C8102E', margin: '0 0 2px' }}>Sign Out</p><p style={{ fontSize: '.72rem', color: '#9ca3af', margin: 0 }}>Return to the main site</p></div>
            </button>
          </div>
        </>}
      </main>

      {/* ══ DESKTOP SIDEBAR ══════════════════════════════════ */}
      <nav className="db-sidebar" aria-label="Student navigation">
        <div className="db-sidebar-brand">
          <img src={cdnLogo} alt="CDN" className="db-sidebar-brand-logo"/>
          <div className="db-sidebar-brand-text"><span className="db-sidebar-brand-name">CDN</span><span className="db-sidebar-brand-sub">Student Portal</span></div>
        </div>
        <div className="db-sidebar-inner">
          {STUDENT_NAV_GROUPS.map(group => (
            <div key={group.group} className="db-sidebar-group">
              <p className="db-sidebar-group-label">{group.group}</p>
              {group.items.map(item => (
                <button key={item.key} className={'db-sidebar-item' + (tab === item.key ? ' db-sidebar-item--active' : '')} onClick={() => setTab(item.key)} aria-current={tab === item.key ? 'page' : undefined}>
                  <span className="db-sidebar-item-icon">{NAV_ICONS[item.key]}</span>
                  <span className="db-sidebar-item-label">{item.label}</span>
                </button>
              ))}
            </div>
          ))}
          <div className="db-sidebar-group">
            <button className="db-sidebar-item" style={{ color: '#C8102E' }} onClick={() => setShowConfirm(true)}>
              <span className="db-sidebar-item-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></span>
              <span className="db-sidebar-item-label">Sign Out</span>
            </button>
          </div>
        </div>
        <div className="db-sidebar-footer">
          <div className="db-sidebar-avatar">{initial}</div>
          <div className="db-sidebar-user"><p className="db-sidebar-user-name">{firstName}</p><p className="db-sidebar-user-role">{user?.course || 'Student'}</p></div>
        </div>
      </nav>

      {/* ══ MOBILE BOTTOM NAV ════════════════════════════════ */}
      <nav className="db-bottom-nav" aria-label="Student navigation">
        {MOBILE_NAV.map(item => (
          <button key={item.key} className={'db-bnav-item' + (tab === item.key ? ' db-bnav-item--active' : '')} onClick={() => setTab(item.key)} aria-label={item.label} aria-current={tab === item.key ? 'page' : undefined}>
            {NAV_ICONS[item.key]}<span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ══ CHATBOT FAB ══════════════════════════════════════ */}
      {!chatOpen && (
        <button className="db-chat-fab" onClick={() => setChatOpen(true)} aria-label="Open CDN Assistant">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><path d="M8 10h8M8 14h5"/></svg>
          <span className="db-chat-fab-label">Ask CDN</span>
        </button>
      )}

      {/* ══ CHATBOT MODAL ════════════════════════════════════ */}
      {chatOpen && (
        <div className="db-chat-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setChatOpen(false); }}>
          <div className="db-chat-panel" role="dialog" aria-label="CDN Portal Assistant">
            <div className="db-chat-header">
              <div className="db-chat-header-left">
                <div className="db-chat-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div>
                <div><p className="db-chat-title">CDN Assistant</p><p className="db-chat-status"><span className="db-chat-online"/>Online</p></div>
              </div>
              <button className="db-chat-close" onClick={() => setChatOpen(false)} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="db-chat-prompts">
              {['Check fines', 'OSAS records', 'Admission info', 'Login help'].map(p => (
                <button key={p} className="db-chat-prompt" onClick={() => sendPrompt(p)}>{p}</button>
              ))}
            </div>
            <div className="db-chat-messages">
              {chatMessages.map((msg, i) => (
                <div key={i} className={'db-chat-msg db-chat-msg--' + msg.from}>
                  {msg.from === 'bot' && <div className="db-chat-msg-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div>}
                  <div className="db-chat-bubble">{msg.text}</div>
                </div>
              ))}
              {chatLoading && (
                <div className="db-chat-msg db-chat-msg--bot">
                  <div className="db-chat-msg-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div>
                  <div className="db-chat-bubble db-chat-typing"><span/><span/><span/></div>
                </div>
              )}
              <div ref={chatEndRef}/>
            </div>
            <form className="db-chat-input-row" onSubmit={(e) => { e.preventDefault(); sendChat(); }}>
              <input type="text" className="db-chat-input" placeholder="Ask about fines, OSAS, admissions…" value={chatInput} onChange={(e) => setChatInput(e.target.value)} autoFocus/>
              <button type="submit" className="db-chat-send" aria-label="Send">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══ SIGN OUT MODAL ════════════════════════════════════ */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfirm(false); }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 380, padding: '1.75rem', boxShadow: '0 24px 64px rgba(0,0,0,.25)', animation: 'dbDropIn .2s ease' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fff0f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <svg style={{ width: 22, height: 22, color: '#C8102E' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0f1724', textAlign: 'center', margin: '0 0 .4rem' }}>Sign out?</h3>
            <p style={{ fontSize: '.84rem', color: '#9ca3af', textAlign: 'center', margin: '0 0 1.5rem' }}>You'll be returned to the main site.</p>
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: '.8rem', borderRadius: 12, border: '1.5px solid #e4e8f2', fontSize: '.88rem', fontWeight: 700, color: '#374151', background: '#f7f8fc', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleLogout} style={{ flex: 1, padding: '.8rem', borderRadius: 12, border: 'none', fontSize: '.88rem', fontWeight: 700, color: '#fff', background: '#C8102E', cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.background = '#a00c24'}
                onMouseLeave={e => e.currentTarget.style.background = '#C8102E'}>Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ TOAST NOTIFICATION STACK ══════════════════════════ */}
      <div style={{
        position: 'fixed', top: 72, right: 16, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: '.6rem',
        pointerEvents: 'none',
      }}>
        {toasts.map((toast) => {
          const cfg = ANN_TYPE[toast.type] || ANN_TYPE.info;
          return (
            <div key={toast._toastId}
              style={{
                pointerEvents: 'all',
                width: 340, maxWidth: 'calc(100vw - 32px)',
                background: '#fff',
                border: `1.5px solid ${cfg.border}`,
                borderLeft: `4px solid ${cfg.color}`,
                borderRadius: 14,
                boxShadow: '0 8px 32px rgba(0,0,0,.14)',
                overflow: 'hidden',
                animation: 'cdn-toast-in .3s cubic-bezier(.2,.8,.4,1) both',
              }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.75rem 1rem .5rem' }}>
                <span style={{ width: 18, height: 18, color: cfg.color, flexShrink: 0 }}>
                  {toast.type === 'event'
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 17H2a3 3 0 000 6h20a3 3 0 000-6z"/><path d="M12 17V3"/><path d="M5 10l7-7 7 7"/></svg>
                  }
                </span>
                <p style={{ flex: 1, fontSize: '.72rem', fontWeight: 800, color: cfg.color, margin: 0, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  New {cfg.label} Announcement
                </p>
                <button onClick={() => setToasts(t => t.filter(x => x._toastId !== toast._toastId))}
                  style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: '#f3f4f6', color: '#9ca3af', cursor: 'pointer', fontSize: '.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', lineHeight: 1 }}>
                  ×
                </button>
              </div>
              {/* Body */}
              <div style={{ padding: '0 1rem .6rem' }}>
                <p style={{ fontSize: '.88rem', fontWeight: 800, color: '#0f1724', margin: '0 0 3px' }}>{toast.title}</p>
                <p style={{ fontSize: '.78rem', color: '#6b7280', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {toast.body}
                </p>
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', gap: '.5rem', padding: '0 1rem .85rem' }}>
                <button
                  onClick={() => { setTab('announcements'); setToasts(t => t.filter(x => x._toastId !== toast._toastId)); }}
                  style={{ padding: '.38rem .9rem', borderRadius: 8, border: 'none', fontSize: '.75rem', fontWeight: 800, color: '#fff', background: cfg.color, cursor: 'pointer', fontFamily: 'inherit' }}>
                  View Announcement
                </button>
                <button onClick={() => setToasts(t => t.filter(x => x._toastId !== toast._toastId))}
                  style={{ padding: '.38rem .9rem', borderRadius: 8, border: '1.5px solid #e4e8f2', fontSize: '.75rem', fontWeight: 700, color: '#6b7280', background: '#f7f8fc', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Dismiss
                </button>
              </div>
              {/* Progress bar (drains over 7s) */}
              <div style={{ height: 3, background: cfg.bg }}>
                <div style={{ height: '100%', background: cfg.color, animation: 'cdn-toast-drain 7s linear forwards', transformOrigin: 'left' }}/>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes cdn-toast-in {
          from { opacity: 0; transform: translateX(110%); }
          to   { opacity: 1; transform: translateX(0);   }
        }
        @keyframes cdn-toast-drain {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

