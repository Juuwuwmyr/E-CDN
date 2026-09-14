import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, PieChart, Pie, Legend, AreaChart, Area,
} from 'recharts';
import '../../styles/dashboard.css';
import '../../styles/login-analytics.css';
import cdnLogo from '../../assets/images/logo.png';
import bagongPilipinasLogo from '../../assets/images/bagong-pilipinas-seeklogo.png';
import { recordLogout } from './LoginAnalytics';
import LoginAnalytics from './LoginAnalytics';
import { recordLogoutSession, recordSystemVisit, getSystemVisitStats, getRecentSystemVisits, getPortalMetrics, subscribeToSystemVisits } from '../../lib/auth';



/* Analytics helpers */
const ANALYTICS_KEY = 'cdn_analytics';
const PAGEVIEW_KEY  = 'cdn_pageviews';

const getAnalytics = () => {
  try { return JSON.parse(localStorage.getItem(ANALYTICS_KEY)) || {}; }
  catch { return {}; }
};
const saveAnalytics = (data) => localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));

const getPageviews = () => {
  try { return JSON.parse(localStorage.getItem(PAGEVIEW_KEY)) || []; }
  catch { return []; }
};

const recordVisit = (sysId, sysLabel) => {
  const analytics = getAnalytics();
  analytics[sysId] = (analytics[sysId] || 0) + 1;
  saveAnalytics(analytics);
  const views = getPageviews();
  views.unshift({ id: sysId, label: sysLabel, ts: Date.now() });
  localStorage.setItem(PAGEVIEW_KEY, JSON.stringify(views.slice(0, 200)));
};

const recordPortalVisit = () => {
  const analytics = getAnalytics();
  analytics.__portal = (analytics.__portal || 0) + 1;
  const today = new Date().toISOString().slice(0, 10);
  const visitors = analytics.__visitors || {};
  visitors[today] = (visitors[today] || 0) + 1;
  analytics.__visitors = visitors;
  saveAnalytics(analytics);
};

/* Static data - only 3 live systems */
const SYSTEMS = [
  {
    id: 'csc',
    label: 'CSC Services',
    sub: 'Fines Management System',
    url: 'https://student-fines-hub-vf9z.vercel.app/',
    color: '#002280', bg: '#eef1fb',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4M7 8h10M7 12h6"/>
      </svg>
    ),
  },
  {
    id: 'osas',
    label: 'OSAS Services',
    sub: 'Violation Tracking System',
    url: 'https://osas-sys.duckdns.org/',
    color: '#C8102E', bg: '#fdf0f2',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
    ),
  },
  {
    id: 'admission',
    label: 'Admission Services',
    sub: 'Admissions Office Portal',
    url: 'https://ecnesis.duckdns.org/',
    color: '#C8960C', bg: '#fdf8ec',
    badge: 'New',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
];

const CATEGORIES = [
  { key: 'academics', label: 'Academics', color: '#002280', bg: '#eef1fb',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg> },
  { key: 'admin', label: 'Admin', color: '#C8102E', bg: '#fdf0f2',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { key: 'finance', label: 'Finance', color: '#C8960C', bg: '#fdf8ec',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
  { key: 'health', label: 'Health', color: '#e11d48', bg: '#fff0f3',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg> },
  { key: 'library', label: 'Library', color: '#7c3aed', bg: '#f5f0ff',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg> },
  { key: 'schedule', label: 'Schedule', color: '#0891b2', bg: '#ecf8fb',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
  { key: 'reports', label: 'Reports', color: '#374151', bg: '#f3f4f6', badge: 'New',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { key: 'more', label: 'More', color: '#6b7280', bg: '#f9fafb',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg> },
];

const BANNERS = [
  { id: 0, tag: 'NEW SYSTEM', title: 'Admissions Portal',
    sub: 'Apply online - faster, paperless enrollment for AY 2026-2027.',
    cta: 'Apply Now', url: 'https://ecnesis.duckdns.org/',
    bg: 'linear-gradient(125deg,#002280 0%,#0044cc 100%)', accent: '#FFD700' },
  { id: 1, tag: 'CSC SERVICES', title: 'Fines Management',
    sub: 'View and settle your outstanding student fines online, anytime.',
    cta: 'Check Fines', url: 'https://student-fines-hub-vf9z.vercel.app/',
    bg: 'linear-gradient(125deg,#7c3aed 0%,#5b21b6 100%)', accent: '#fbbf24' },
  { id: 2, tag: 'OSAS', title: 'Violation Tracking',
    sub: 'Monitor and resolve student conduct records through OSAS.',
    cta: 'View Records', url: 'https://osas-sys.duckdns.org/',
    bg: 'linear-gradient(125deg,#C8102E 0%,#9b0921 100%)', accent: '#fde68a' },
];

const DROPDOWN_ITEMS = [
  {
    label: 'My Profile',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
    ),
  },
  {
    label: 'Help',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
];

/* Helpers */
const getDayDate = () =>
  new Date().toLocaleDateString('en-PH', { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit' });

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const fmt = (n) => (n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n));

const timeAgo = (ts) => {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)   return diff + 's ago';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
};

/* Dashboard Component */
const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [searchQuery,     setSearchQuery]     = useState('');
  const [bannerIdx,       setBannerIdx]       = useState(0);
  const [profileOpen,     setProfileOpen]     = useState(false);
  const [notifOpen,       setNotifOpen]       = useState(false);
  const [analytics,       setAnalytics]       = useState({});
  const [recentVisits,    setRecentVisits]    = useState([]);
  const [activeTab,       setActiveTab]       = useState('overview');
  const [editingName,     setEditingName]     = useState(false);
  const [displayName,     setDisplayName]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('cdn_user'))?.name ?? 'User'; } catch { return 'User'; }
  });
  const [chatOpen,        setChatOpen]        = useState(false);
  const [chatInput,       setChatInput]       = useState('');
  const [chatMessages,    setChatMessages]    = useState([
    { from: 'bot', text: 'Hi! I\'m the CDN Portal Assistant. How can I help you today?' },
  ]);

  // ── DB-backed Activity state ──────────────────────────────
  const [dbVisitStats,    setDbVisitStats]    = useState({});   // { csc: 5, osas: 3, ... }
  const [dbRecentVisits,  setDbRecentVisits]  = useState([]);   // last 20 system_visits rows
  const [dbPortalMetrics, setDbPortalMetrics] = useState({ totalSessions: 0, todaySessions: 0, totalClicks: 0, uniqueDays: 0 });
  const [activityLoading, setActivityLoading] = useState(true);

  const bannerTimer = useRef(null);
  const profileRef  = useRef(null);
  const notifRef    = useRef(null);
  const chatEndRef  = useRef(null);

  // ── Fetch all Activity data from Supabase ─────────────────
  const fetchActivity = async () => {
    try {
      const [stats, recent, metrics] = await Promise.all([
        getSystemVisitStats(),
        getRecentSystemVisits(20),
        getPortalMetrics(),
      ]);
      setDbVisitStats(stats);
      setDbRecentVisits(recent);
      setDbPortalMetrics(metrics);
    } catch (e) {
      console.error('fetchActivity error:', e);
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    recordPortalVisit();
    setAnalytics(getAnalytics());
    setRecentVisits(getPageviews());
    // Initial load of DB activity data
    fetchActivity();
  }, []);

  // ── Supabase Realtime: refresh Activity on any new system visit ──
  useEffect(() => {
    const channel = subscribeToSystemVisits(() => fetchActivity());
    const poll    = setInterval(() => fetchActivity(), 5000);
    return () => {
      channel.unsubscribe();
      clearInterval(poll);
    };
  }, []);

  useEffect(() => {
    bannerTimer.current = setInterval(() =>
      setBannerIdx((i) => (i + 1) % BANNERS.length), 5000);
    return () => clearInterval(bannerTimer.current);
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current  && !notifRef.current.contains(e.target))   setNotifOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatOpen]);

  const handleLogout = async () => {
    const sessionId = localStorage.getItem('cdn_session');
    await recordLogoutSession(sessionId);
    recordLogout(user.studentNumber || user.username, user.username);
    localStorage.removeItem('cdn_user');
    localStorage.removeItem('cdn_session');
    onLogout();
  };

  const handleSysClick = (sys) => {
    if (sys.url === '#') return;
    // Record locally (for legacy analytics)
    recordVisit(sys.id, sys.label);
    setAnalytics(getAnalytics());
    setRecentVisits(getPageviews());
    // Record to Supabase DB (triggers realtime refresh of Activity tab)
    recordSystemVisit(sys.id, sys.label, user?.username ?? null);
    window.open(sys.url, '_blank', 'noopener,noreferrer');
  };



  const BOT_REPLIES = {
    fines:     'You can check and settle your student fines at the CSC Services portal - click the card on the Overview tab.',
    osas:      'OSAS handles violation tracking. Click the OSAS Services card to access your records.',
    admission: 'For admissions, go to Admission Services (ECNESIS Portal) on the Overview tab.',
    login:     'Use your CDN credentials (username + password) provided by your department coordinator.',
    help:      'You can access all CDN systems from the Overview tab. Click any service card to open it.',
  };

  const sendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatMessages(m => [...m, { from: 'user', text }]);
    setChatInput('');
    const lower = text.toLowerCase();
    let reply = 'I\'m not sure about that. Try asking about fines, OSAS, admissions, or login help.';
    if (lower.includes('fine') || lower.includes('csc'))           reply = BOT_REPLIES.fines;
    else if (lower.includes('osas') || lower.includes('viol'))     reply = BOT_REPLIES.osas;
    else if (lower.includes('admiss') || lower.includes('enroll')) reply = BOT_REPLIES.admission;
    else if (lower.includes('login') || lower.includes('pass'))    reply = BOT_REPLIES.login;
    else if (lower.includes('help') || lower.includes('how'))      reply = BOT_REPLIES.help;
    setTimeout(() => setChatMessages(m => [...m, { from: 'bot', text: reply }]), 600);
  };

  const filtered = searchQuery.trim()
    ? SYSTEMS.filter(s =>
        s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.sub.toLowerCase().includes(searchQuery.toLowerCase()))
    : SYSTEMS;

  const totalPortalVisits = analytics.__portal || 0;
  const visitorsObj       = analytics.__visitors || {};
  const today             = new Date().toISOString().slice(0, 10);
  const todayVisits       = visitorsObj[today] || 0;
  const topSystems        = SYSTEMS.map(s => ({ ...s, visits: analytics[s.id] || 0 })).sort((a, b) => b.visits - a.visits);
  const totalClicks       = SYSTEMS.reduce((sum, s) => sum + (analytics[s.id] || 0), 0);
  const banner            = BANNERS[bannerIdx];

  return (
    <div className="db-root">

      {/* TOPBAR */}
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
              <circle cx="12" cy="10" r="3"/>
              <path d="M12 2a8 8 0 010 16c-4 0-8-5.37-8-8a8 8 0 0116 0z"/>
            </svg>
            <span>Naujan, Oriental Mindoro</span>
            <span className="db-topbar-sep">·</span>
            <span>{getDayDate()}</span>
          </div>

          <div className="db-topbar-actions">
            {/* Bell */}
            <div className="db-notif-wrap" ref={notifRef}>
              <button className="db-icon-btn"
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                aria-label="Notifications">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 01-3.46 0"/>
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
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                aria-label="Account menu">
                <div className="db-avatar">{user?.name?.charAt(0).toUpperCase() ?? 'U'}</div>
                <div className="db-profile-text">
                  <span className="db-profile-greeting">
                    {getGreeting()}, <strong>{user?.name?.split(' ')[0] ?? 'User'}</strong>
                  </span>
                  <span className="db-profile-role">{user?.role ?? 'Member'}</span>
                </div>
                <svg className="db-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"/>
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
                    <button key={item.label} className="db-dropdown-item">
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                  <div className="db-dropdown-divider" />
                  <button className="db-dropdown-item db-dropdown-item--danger" onClick={handleLogout}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="db-main">

        {/* Hero */}
        <div className="db-hero">
          <div className="db-hero-noise" aria-hidden="true" />
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {SYSTEMS.length} Systems Connected
                </span>
                <span className="db-hero-pill db-hero-pill--gold">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  AY 2026-2027
                </span>
              </div>
            </div>
            <img src={bagongPilipinasLogo} alt="Bagong Pilipinas" className="db-hero-bp" />
          </div>
        </div>

        {/* ── HOME TAB: Hero + Stats + Live Login Analytics only ── */}
        {activeTab === 'overview' && (
          <div className="db-home-content">
            {/* Stats row */}
            <div className="db-stats-row">
              {[
                {
                  label: 'Portal Visits', value: fmt(totalPortalVisits), sub: '+' + todayVisits + ' today',
                  color: '#002280', bg: '#eef1fb',
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
                },
                {
                  label: 'System Clicks', value: fmt(totalClicks), sub: 'across all services',
                  color: '#C8960C', bg: '#fdf8ec',
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
                },
                {
                  label: 'Most Visited',
                  value: topSystems[0]?.visits > 0 ? topSystems[0].label.split(' ')[0] : 'None',
                  sub: topSystems[0]?.visits > 0 ? topSystems[0].visits + ' clicks' : 'No activity yet',
                  color: '#10813f', bg: '#edf7f1',
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
                },
                {
                  label: 'Active Systems', value: SYSTEMS.length, sub: 'live portals',
                  color: '#7c3aed', bg: '#f5f0ff',
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
                },
              ].map((stat) => (
                <div key={stat.label} className="db-stat-card" style={{ '--sc': stat.color, '--sc-bg': stat.bg }}>
                  <div className="db-stat-icon" style={{ background: stat.bg, color: stat.color }}>
                    {stat.icon}
                  </div>
                  <div className="db-stat-body">
                    <p className="db-stat-value">{stat.value}</p>
                    <p className="db-stat-label">{stat.label}</p>
                    <p className="db-stat-sub">{stat.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Login Analytics — real-time active users */}
            <LoginAnalytics />
          </div>
        )}

        {/* ── ACTIVITY TAB: Fully separate section — all data from Supabase ── */}
        {activeTab === 'activity' && (() => {
          // Derive top systems from DB stats
          const dbTotalClicks = dbPortalMetrics.totalClicks;
          const dbTopSystems  = SYSTEMS
            .map(s => ({ ...s, visits: dbVisitStats[s.id] || 0 }))
            .sort((a, b) => b.visits - a.visits);

          return (
            <div className="db-activity-layout">

              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                marginBottom: 4, padding: '4px 0 16px',
                borderBottom: '1.5px solid #e5e7eb',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: '#fdf8ec', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#C8960C', flexShrink: 0,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F1422' }}>Activity</h2>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Live indicator */}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: '0.72rem', fontWeight: 700,
                    background: '#edf7f1', color: '#10813f', borderRadius: 20,
                    padding: '3px 10px', border: '1px solid #bbf7d0',
                  }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: '#10813f', display: 'inline-block',
                      animation: 'pulse 2s infinite',
                    }} />
                    Live
                  </span>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700,
                    background: '#fdf8ec', color: '#C8960C', borderRadius: 20,
                    padding: '3px 10px', border: '1px solid #f5e6c0',
                  }}>
                    {activityLoading ? '…' : dbTotalClicks} clicks
                  </span>
                </div>
              </div>

              {/* ── Top Visited Systems ── */}
              <div className="db-panel">
                <div className="db-panel-header">
                  <div className="db-panel-header-left">
                    <div className="db-panel-icon db-panel-icon--gold">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                        <polyline points="17 6 23 6 23 12"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="db-panel-title">Top Visited Systems</h3>
                      <p className="db-panel-sub">Ranked by total clicks — all time</p>
                    </div>
                  </div>
                  <span className="db-badge-pill db-badge-pill--gold">All time</span>
                </div>

                {activityLoading ? (
                  <div className="db-empty-state"><p>Loading…</p></div>
                ) : dbTotalClicks === 0 ? (
                  <div className="db-empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                    <p>No system visits recorded yet.</p>
                    <span>Visits will appear here when students click any service.</span>
                  </div>
                ) : (
                  <div className="db-top-list">
                    {dbTopSystems.map((sys, idx) => {
                      const pct = dbTotalClicks > 0 ? Math.round((sys.visits / dbTotalClicks) * 100) : 0;
                      return (
                        <div key={sys.id} className="db-top-row">
                          <span className={'db-top-rank db-top-rank--' + (idx + 1)}>#{idx + 1}</span>
                          <div className="db-top-icon" style={{ background: sys.bg, color: sys.color }}>
                            {sys.icon}
                          </div>
                          <div className="db-top-info">
                            <div className="db-top-name-row">
                              <span className="db-top-name">{sys.label}</span>
                              <span className="db-top-count" style={{ color: sys.color }}>{sys.visits} visits</span>
                            </div>
                            <div className="db-top-bar-bg">
                              <div className="db-top-bar-fill" style={{ width: pct + '%', background: sys.color }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="db-activity-cols">

                {/* ── Visit Summary ── */}
                <div className="db-panel">
                  <div className="db-panel-header">
                    <div className="db-panel-header-left">
                      <div className="db-panel-icon db-panel-icon--blue">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <path d="M3 9h18M9 21V9"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="db-panel-title">Visit Summary</h3>
                        <p className="db-panel-sub">Per-system breakdown from database</p>
                      </div>
                    </div>
                  </div>
                  <div className="db-summary-grid">
                    {SYSTEMS.map(sys => (
                      <div key={sys.id} className="db-summary-cell" style={{ '--sc': sys.color, '--sc-bg': sys.bg }}>
                        <div className="db-summary-icon" style={{ background: sys.bg, color: sys.color }}>
                          {sys.icon}
                        </div>
                        <p className="db-summary-count" style={{ color: sys.color }}>
                          {activityLoading ? '…' : (dbVisitStats[sys.id] || 0)}
                        </p>
                        <p className="db-summary-name">{sys.label.split(' ')[0]}</p>
                      </div>
                    ))}
                  </div>
                  <div className="db-summary-total">
                    <div>
                      <p className="db-summary-total-label">Total System Clicks</p>
                      <p className="db-summary-total-sub">All systems · all time · from database</p>
                    </div>
                    <span className="db-summary-total-val">{activityLoading ? '…' : dbTotalClicks}</span>
                  </div>
                </div>

                {/* ── Recent Activity (from DB) ── */}
                <div className="db-panel">
                  <div className="db-panel-header">
                    <div className="db-panel-header-left">
                      <div className="db-panel-icon db-panel-icon--green">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="db-panel-title">Recent Activity</h3>
                        <p className="db-panel-sub">Latest system visits from database</p>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 700, color: '#10813f',
                      background: '#edf7f1', borderRadius: 20, padding: '2px 8px',
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10813f', display: 'inline-block' }} />
                      Live
                    </span>
                  </div>

                  {activityLoading ? (
                    <div className="db-empty-state"><p>Loading…</p></div>
                  ) : dbRecentVisits.length === 0 ? (
                    <div className="db-empty-state">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <p>No activity yet.</p>
                      <span>Visits will appear here in real-time.</span>
                    </div>
                  ) : (
                    <div className="db-activity-log">
                      {dbRecentVisits.map((v, i) => {
                        const sys = SYSTEMS.find(s => s.id === v.system_id);
                        const diffMin = Math.round((Date.now() - new Date(v.visited_at).getTime()) / 60000);
                        const timeStr = diffMin < 1 ? 'just now'
                          : diffMin < 60 ? diffMin + 'm ago'
                          : diffMin < 1440 ? Math.floor(diffMin / 60) + 'h ago'
                          : new Date(v.visited_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        return (
                          <div key={v.id ?? i} className="db-log-row">
                            <div className="db-log-dot" style={{ background: sys?.color ?? '#9ca3af' }} />
                            <div className="db-log-info">
                              <span className="db-log-label">{v.system_label}</span>
                              <span className="db-log-sub">
                                {v.user_id ? 'by ' + v.user_id : 'anonymous visit'}
                              </span>
                            </div>
                            <span className="db-log-time">{timeStr}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Portal Metrics (all from DB) ── */}
              <div className="db-panel db-portal-metrics">
                <div className="db-panel-header">
                  <div className="db-panel-header-left">
                    <div className="db-panel-icon db-panel-icon--purple">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="db-panel-title">Portal Metrics</h3>
                      <p className="db-panel-sub">Overall CDN E-Portal engagement</p>
                    </div>
                  </div>
                </div>
                <div className="db-metrics-grid">
                  {[
                    { label: 'Total Login Sessions', value: dbPortalMetrics.totalSessions, color: '#002280',
                      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                    { label: 'Logins Today', value: dbPortalMetrics.todaySessions, color: '#10813f',
                      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
                    { label: 'System Clicks', value: dbPortalMetrics.totalClicks, color: '#C8960C',
                      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
                    { label: 'Active Days', value: dbPortalMetrics.uniqueDays, color: '#7c3aed',
                      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
                  ].map(m => (
                    <div key={m.label} className="db-metric-card">
                      <div className="db-metric-icon" style={{ color: m.color }}>{m.icon}</div>
                      <p className="db-metric-val" style={{ color: m.color }}>
                        {activityLoading ? '…' : m.value}
                      </p>
                      <p className="db-metric-label">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          );
        })()}




        {activeTab === 'account' && (
          <div className="db-account-layout">

            {/* Profile card */}
            <div className="db-account-hero">
              <div className="db-account-hero-noise" aria-hidden="true" />
              <div className="db-account-avatar-wrap">
                <div className="db-account-avatar">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="db-account-avatar-ring" aria-hidden="true" />
              </div>
              <div className="db-account-hero-info">
                {editingName ? (
                  <form
                    className="db-account-name-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setEditingName(false);
                      try {
                        const u = JSON.parse(localStorage.getItem('cdn_user')) || {};
                        u.name = displayName;
                        localStorage.setItem('cdn_user', JSON.stringify(u));
                      } catch {}
                    }}
                  >
                    <input
                      className="db-account-name-input"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      autoFocus
                    />
                    <button type="submit" className="db-account-name-save">Save</button>
                    <button type="button" className="db-account-name-cancel" onClick={() => setEditingName(false)}>Cancel</button>
                  </form>
                ) : (
                  <div className="db-account-name-row">
                    <h2 className="db-account-name">{displayName}</h2>
                    <button className="db-account-edit-btn" onClick={() => setEditingName(true)} aria-label="Edit name">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  </div>
                )}
                <span className="db-account-role-badge">{user?.role ?? 'Member'}</span>
                <p className="db-account-username">@{user?.username ?? 'user'}</p>
              </div>
            </div>

            {/* Info cards */}
            <div className="db-account-section-title">Account Details</div>
            <div className="db-account-info-grid">
              {[
                {
                  label: 'Full Name', value: displayName,
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
                  color: '#002280', bg: '#eef1fb',
                },
                {
                  label: 'Username', value: user?.username ?? '—',
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7"/></svg>,
                  color: '#7c3aed', bg: '#f5f0ff',
                },
                {
                  label: 'Role', value: user?.role ?? '—',
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
                  color: '#C8102E', bg: '#fdf0f2',
                },
                {
                  label: 'Portal Access', value: 'CDN E-Portal',
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
                  color: '#10813f', bg: '#edf7f1',
                },
              ].map(item => (
                <div key={item.label} className="db-account-info-card" style={{ '--ac': item.color, '--ac-bg': item.bg }}>
                  <div className="db-account-info-icon" style={{ background: item.bg, color: item.color }}>
                    {item.icon}
                  </div>
                  <div className="db-account-info-body">
                    <p className="db-account-info-label">{item.label}</p>
                    <p className="db-account-info-value">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>


            {/* Settings list */}
            <div className="db-account-section-title">Settings</div>
            <div className="db-account-settings-list">
              {[
                {
                  label: 'My Profile',
                  sub: 'View and edit your display name',
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
                  color: '#002280',
                  action: () => setEditingName(true),
                },
                {
                  label: 'Notifications',
                  sub: 'Manage alert preferences',
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
                  color: '#C8960C',
                  action: () => setNotifOpen(true),
                },
                {
                  label: 'Help & Support',
                  sub: 'FAQs and contact information',
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
                  color: '#7c3aed',
                  action: () => setChatOpen(true),
                },
              ].map(item => (
                <button key={item.label} className="db-account-settings-row" onClick={item.action}>
                  <div className="db-account-settings-icon" style={{ color: item.color }}>
                    {item.icon}
                  </div>
                  <div className="db-account-settings-body">
                    <p className="db-account-settings-label">{item.label}</p>
                    <p className="db-account-settings-sub">{item.sub}</p>
                  </div>
                  <svg className="db-account-settings-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              ))}
            </div>

            {/* Sign out */}
            <div className="db-account-signout-wrap">
              <button className="db-account-signout" onClick={handleLogout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign Out
              </button>
              <p className="db-account-signout-hint">You'll be returned to the main site.</p>
            </div>

          </div>
        )}

      </main>

      {/* BOTTOM NAV */}
      <nav className="db-bottom-nav">
        {[
          { label: 'Home', tab: 'overview',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
          { label: 'Activity', tab: 'activity',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
          { label: 'Chatbot', center: true,
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><path d="M8 10h8M8 14h5"/></svg> },
          { label: 'History', route: '/dashboard/history',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
          { label: 'Account', route: '/dashboard/account',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
        ].map(item => (
          <button key={item.label}
            className={
              'db-bnav-item' +
              (item.center ? ' db-bnav-item--center' : '') +
              (item.tab && activeTab === item.tab ? ' db-bnav-item--active' : '')
            }
            onClick={() => {
              if (item.tab)                 setActiveTab(item.tab);
              if (item.label === 'Chatbot') setChatOpen(true);
              if (item.route)               navigate(item.route);
            }}
            aria-label={item.label}>
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* CHATBOT FLOATING FAB — PC only */}
      {!chatOpen && (
        <button
          className="db-chat-fab"
          onClick={() => setChatOpen(true)}
          aria-label="Open CDN Assistant"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            <path d="M8 10h8M8 14h5"/>
          </svg>
          <span className="db-chat-fab-label">Ask CDN</span>
        </button>
      )}

      {/* CHATBOT MODAL */}
      {chatOpen && (
        <div className="db-chat-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) setChatOpen(false); }}>
          <div className="db-chat-panel" role="dialog" aria-label="CDN Portal Assistant">
            <div className="db-chat-header">
              <div className="db-chat-header-left">
                <div className="db-chat-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                </div>
                <div>
                  <p className="db-chat-title">CDN Assistant</p>
                  <p className="db-chat-status"><span className="db-chat-online" />Online</p>
                </div>
              </div>
              <button className="db-chat-close" onClick={() => setChatOpen(false)} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
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
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                      </svg>
                    </div>
                  )}
                  <div className="db-chat-bubble">{msg.text}</div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form className="db-chat-input-row"
              onSubmit={(e) => { e.preventDefault(); sendChat(); }}>
              <input type="text" className="db-chat-input"
                placeholder="Ask about fines, OSAS, admissions..."
                value={chatInput} onChange={(e) => setChatInput(e.target.value)} autoFocus />
              <button type="submit" className="db-chat-send" aria-label="Send">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
