import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/dashboard.css';
import cdnLogo from '../../assets/images/logo.png';
import bagongPilipinasLogo from '../../assets/images/bagong-pilipinas-seeklogo.png';

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   ANALYTICS HELPERS  (localStorage-based)
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const ANALYTICS_KEY  = 'cdn_analytics';
const PAGEVIEW_KEY   = 'cdn_pageviews';

const getAnalytics = () => {
  try { return JSON.parse(localStorage.getItem(ANALYTICS_KEY)) || {}; }
  catch { return {}; }
};
const saveAnalytics = (data) =>
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));

const getPageviews = () => {
  try { return JSON.parse(localStorage.getItem(PAGEVIEW_KEY)) || []; }
  catch { return []; }
};

/** Record a click on a system link */
const recordVisit = (sysId, sysLabel) => {
  const now = Date.now();
  // counts per system
  const analytics = getAnalytics();
  analytics[sysId] = (analytics[sysId] || 0) + 1;
  saveAnalytics(analytics);
  // timeline log (keep last 200)
  const views = getPageviews();
  views.unshift({ id: sysId, label: sysLabel, ts: now });
  localStorage.setItem(PAGEVIEW_KEY, JSON.stringify(views.slice(0, 200)));
};

/** Increment overall portal visits */
const recordPortalVisit = () => {
  const analytics = getAnalytics();
  analytics.__portal = (analytics.__portal || 0) + 1;
  // unique visitors (keyed by day)
  const today = new Date().toISOString().slice(0, 10);
  const visitors = analytics.__visitors || {};
  if (!visitors[today]) visitors[today] = 0;
  visitors[today] += 1;
  analytics.__visitors = visitors;
  saveAnalytics(analytics);
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   STATIC DATA
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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
  { key: 'admin',     label: 'Admin',     color: '#C8102E', bg: '#fdf0f2',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { key: 'finance',   label: 'Finance',   color: '#C8960C', bg: '#fdf8ec',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
  { key: 'health',    label: 'Health',    color: '#e11d48', bg: '#fff0f3',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg> },
  { key: 'library',   label: 'Library',   color: '#7c3aed', bg: '#f5f0ff',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg> },
  { key: 'schedule',  label: 'Schedule',  color: '#0891b2', bg: '#ecf8fb',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
  { key: 'reports',   label: 'Reports',   color: '#374151', bg: '#f3f4f6', badge: 'New',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { key: 'more',      label: 'More',      color: '#6b7280', bg: '#f9fafb',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg> },
];

const BANNERS = [
  { id: 0, tag: 'NEW SYSTEM', title: 'Admissions Portal',
    sub: 'Apply online â€” faster, paperless enrollment for AY 2026â€“2027.',
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   HELPERS
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   DASHBOARD COMPONENT
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [searchQuery,  setSearchQuery]  = useState('');
  const [bannerIdx,    setBannerIdx]    = useState(0);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [analytics,    setAnalytics]    = useState({});
  const [recentVisits, setRecentVisits] = useState([]);
  const [activeTab,    setActiveTab]    = useState('overview');
  const [chatOpen,     setChatOpen]     = useState(false);
  const [chatInput,    setChatInput]    = useState('');
  const [chatMessages, setChatMessages] = useState([
    { from: 'bot', text: 'Hi! I\'m the CDN Portal Assistant. How can I help you today?' },
  ]);
  const bannerTimer = useRef(null);
  const profileRef  = useRef(null);
  const notifRef    = useRef(null);
  const chatEndRef  = useRef(null);

  /* Record portal visit on mount */
  useEffect(() => {
    recordPortalVisit();
    setAnalytics(getAnalytics());
    setRecentVisits(getPageviews());
  }, []);

  /* Banner auto-advance */
  useEffect(() => {
    bannerTimer.current = setInterval(() =>
      setBannerIdx((i) => (i + 1) % BANNERS.length), 5000);
    return () => clearInterval(bannerTimer.current);
  }, []);

  /* Close dropdowns on outside click */
  useEffect(() => {
    const h = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current  && !notifRef.current.contains(e.target))   setNotifOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('cdn_user');
    onLogout();
    // navigation is handled by App's onLogout → setUser(null) → RequireAuth redirect
  };

  /* Chatbot auto-scroll */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatOpen]);

  const BOT_REPLIES = {
    fines: 'You can check and settle your student fines at the CSC Services portal â€” click the card on the Overview tab.',
    osas:  'OSAS handles violation tracking. Click the OSAS Services card to access your records.',
    admission: 'For admissions, go to Admission Services (ECNESIS Portal) on the Overview tab.',
    student: 'The Student Portal shows grades and enrollment info. It\'s coming soon.',
    login:  'Use your CDN credentials (username + password) provided by your department coordinator.',
    help:   'You can access all CDN systems from the Overview tab. Click any service card to open it.',
  };

  const sendChatMessage = () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatMessages(m => [...m, { from: 'user', text }]);
    setChatInput('');
    const lower = text.toLowerCase();
    let reply = 'I\'m not sure about that. Try asking about fines, OSAS, admissions, or login help.';
    if (lower.includes('fine') || lower.includes('csc'))      reply = BOT_REPLIES.fines;
    else if (lower.includes('osas') || lower.includes('viol')) reply = BOT_REPLIES.osas;
    else if (lower.includes('admiss') || lower.includes('enroll')) reply = BOT_REPLIES.admission;
    else if (lower.includes('student') || lower.includes('grade')) reply = BOT_REPLIES.student;
    else if (lower.includes('login') || lower.includes('pass') || lower.includes('cred')) reply = BOT_REPLIES.login;
    else if (lower.includes('help') || lower.includes('how'))  reply = BOT_REPLIES.help;
    setTimeout(() => setChatMessages(m => [...m, { from: 'bot', text: reply }]), 600);
  };

  const handleSysClick = (sys) => {
    if (sys.url === '#') return;
    recordVisit(sys.id, sys.label);
    setAnalytics(getAnalytics());
    setRecentVisits(getPageviews());
    window.open(sys.url, '_blank', 'noopener,noreferrer');
  };

  const filtered = searchQuery.trim()
    ? SYSTEMS.filter(s =>
        s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.sub.toLowerCase().includes(searchQuery.toLowerCase()))
    : SYSTEMS;

  /* Derived analytics */
  const totalPortalVisits = analytics.__portal || 0;
  const visitorsObj       = analytics.__visitors || {};
  const totalUniqueVisits = Object.values(visitorsObj).reduce((a, b) => a + b, 0);
  const today             = new Date().toISOString().slice(0, 10);
  const todayVisits       = visitorsObj[today] || 0;

  /* Top visited systems */
  const topSystems = SYSTEMS
    .map(s => ({ ...s, visits: analytics[s.id] || 0 }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5);

  /* Total system clicks */
  const totalClicks = SYSTEMS.reduce((sum, s) => sum + (analytics[s.id] || 0), 0);

  const banner = BANNERS[bannerIdx];

  return (
    <div className="db-root">

      {/* â•â• TOPBAR â•â• */}
      <header className="db-topbar">
        <div className="db-topbar-inner">

          {/* Brand */}
          <div className="db-topbar-brand">
            <img src={cdnLogo} alt="CDN" className="db-topbar-logo" />
            <div className="db-topbar-wordmark">
              <span className="db-topbar-school">CDN</span>
              <span className="db-topbar-portal">E-Portal</span>
            </div>
          </div>

          {/* Meta */}
          <div className="db-topbar-meta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="10" r="3"/>
              <path d="M12 2a8 8 0 010 16c-4 0-8-5.37-8-8a8 8 0 0116 0z"/>
            </svg>
            <span>Naujan, Oriental Mindoro</span>
            <span className="db-topbar-sep">Â·</span>
            <span>{getDayDate()}</span>
          </div>

          {/* Actions */}
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
                  {[{ icon: 'ðŸ‘¤', label: 'My Profile' }, { icon: 'âš™ï¸', label: 'Settings' }, { icon: 'â“', label: 'Help' }]
                    .map(item => (
                      <button key={item.label} className="db-dropdown-item">
                        <span>{item.icon}</span>{item.label}
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

      {/* â•â• MAIN â•â• */}
      <main className="db-main">

        {/* â”€â”€ HERO GREETING + STATS â”€â”€ */}
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
                Welcome to <strong>CDN E-Portal</strong> â€” your gateway to all Colegio De Naujan systems.
              </p>
              <div className="db-hero-pills">
                <span className="db-hero-pill">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {SYSTEMS.length} Systems Connected
                </span>
                <span className="db-hero-pill db-hero-pill--gold">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  AY 2026â€“2027
                </span>
              </div>
            </div>
            <img src={bagongPilipinasLogo} alt="Bagong Pilipinas" className="db-hero-bp" />
          </div>
        </div>

        {/* â”€â”€ STATS SUMMARY CARDS â”€â”€ */}
        <div className="db-stats-row">
          {[
            {
              label: 'Portal Visits',
              value: fmt(totalPortalVisits),
              sub: `+${todayVisits} today`,
              color: '#002280', bg: '#eef1fb',
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              ),
            },
            {
              label: 'System Clicks',
              value: fmt(totalClicks),
              sub: 'across all services',
              color: '#C8960C', bg: '#fdf8ec',
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              ),
            },
            {
              label: 'Most Visited',
              value: topSystems[0]?.visits > 0 ? topSystems[0].label.split(' ')[0] : 'â€”',
              sub: topSystems[0]?.visits > 0 ? `${topSystems[0].visits} clicks` : 'No activity yet',
              color: '#10813f', bg: '#edf7f1',
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              ),
            },
            {
              label: 'Active Systems',
              value: SYSTEMS.filter(s => s.url !== '#').length,
              sub: `${SYSTEMS.length} total Â· ${SYSTEMS.filter(s => s.url === '#').length} soon`,
              color: '#7c3aed', bg: '#f5f0ff',
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2"/>
                  <path d="M8 21h8M12 17v4"/>
                </svg>
              ),
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

        {/* â”€â”€ TABS â”€â”€ */}
        <div className="db-tabs-bar">
          {['overview', 'activity'].map(tab => (
            <button
              key={tab}
              className={`db-tab${activeTab === tab ? ' db-tab--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'overview' ? (
                <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> Overview</>
              ) : (
                <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> Site Activity</>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <>
            {/* â”€â”€ SEARCH â”€â”€ */}
            <div className="db-search-wrap">
              <div className="db-search-box">
                <svg className="db-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  className="db-search-input"
                  placeholder="Search services like Fines, Admission, OSAS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="db-search-clear" onClick={() => setSearchQuery('')} aria-label="Clear">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* â”€â”€ CATEGORY ICONS â”€â”€ */}
            <div className="db-panel">
              <div className="db-cat-scroll">
                {CATEGORIES.map((cat) => (
                  <button key={cat.key} className="db-cat-item">
                    <div className="db-cat-icon-wrap" style={{ background: cat.bg, color: cat.color }}>
                      {cat.icon}
                      {cat.badge && <span className="db-cat-badge">{cat.badge}</span>}
                    </div>
                    <span className="db-cat-label">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* â”€â”€ BANNER + HIGHLIGHT SIDE BY SIDE â”€â”€ */}
            <div className="db-banner-row">
              {/* Banner carousel */}
              <div className="db-banner-col">
                <div className="db-banner" style={{ background: banner.bg }}>
                  <div className="db-banner-content">
                    <span className="db-banner-tag" style={{ color: banner.accent }}>{banner.tag}</span>
                    <h2 className="db-banner-title">{banner.title}</h2>
                    <p className="db-banner-sub">{banner.sub}</p>
                    <a href={banner.url} target="_blank" rel="noopener noreferrer"
                      className="db-banner-cta" style={{ background: banner.accent, color: '#0f1724' }}
                      onClick={() => { recordVisit('banner_' + banner.id, banner.title); setAnalytics(getAnalytics()); }}>
                      {banner.cta}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </a>
                  </div>
                  <div className="db-banner-deco" aria-hidden="true">
                    <svg viewBox="0 0 160 160" fill="none">
                      <circle cx="80" cy="80" r="74" stroke="rgba(255,255,255,0.07)" strokeWidth="2"/>
                      <circle cx="80" cy="80" r="52" stroke="rgba(255,255,255,0.05)" strokeWidth="2"/>
                      <circle cx="80" cy="80" r="28" stroke="rgba(255,255,255,0.09)" strokeWidth="2"/>
                      <circle cx="80" cy="80" r="10" fill="rgba(255,255,255,0.06)"/>
                    </svg>
                  </div>
                </div>
                <div className="db-banner-dots">
                  {BANNERS.map((_, i) => (
                    <button key={i}
                      className={`db-banner-dot${bannerIdx === i ? ' db-banner-dot--active' : ''}`}
                      onClick={() => { setBannerIdx(i); clearInterval(bannerTimer.current);
                        bannerTimer.current = setInterval(() => setBannerIdx(x => (x + 1) % BANNERS.length), 5000); }}
                      aria-label={`Banner ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Highlight cards */}
              <div className="db-highlight-col">
                <a href="https://student-fines-hub-vf9z.vercel.app/" target="_blank" rel="noopener noreferrer"
                  className="db-hl-card db-hl-card--blue"
                  onClick={() => { recordVisit('csc', 'CSC Services'); setAnalytics(getAnalytics()); }}>
                  <div className="db-hl-body">
                    <p className="db-hl-tag">CSC</p>
                    <p className="db-hl-name">Student Fines Hub</p>
                    <p className="db-hl-visits">{analytics.csc || 0} visits</p>
                  </div>
                  <div className="db-hl-art">
                    <svg viewBox="0 0 56 56" fill="none">
                      <rect x="8" y="10" width="40" height="32" rx="4" stroke="rgba(255,255,255,0.25)" strokeWidth="1.8"/>
                      <path d="M18 22h20M18 30h12" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" strokeLinecap="round"/>
                      <circle cx="42" cy="42" r="9" fill="rgba(255,215,0,0.2)" stroke="#FFD700" strokeWidth="1.5"/>
                      <path d="M42 38v4l2.5 2" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                </a>
                <a href="https://osas-sys.duckdns.org/" target="_blank" rel="noopener noreferrer"
                  className="db-hl-card db-hl-card--red"
                  onClick={() => { recordVisit('osas', 'OSAS Services'); setAnalytics(getAnalytics()); }}>
                  <div className="db-hl-body">
                    <p className="db-hl-tag">OSAS</p>
                    <p className="db-hl-name">Violation Tracker</p>
                    <p className="db-hl-visits">{analytics.osas || 0} visits</p>
                  </div>
                  <div className="db-hl-art">
                    <svg viewBox="0 0 56 56" fill="none">
                      <path d="M28 6L6 16v14c0 12 10 20 22 24 12-4 22-12 22-24V16L28 6z" stroke="rgba(255,255,255,0.3)" strokeWidth="1.8"/>
                      <path d="M20 28l5 5 11-11" stroke="rgba(255,255,255,0.55)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </a>
                <a href="https://ecnesis.duckdns.org/" target="_blank" rel="noopener noreferrer"
                  className="db-hl-card db-hl-card--gold"
                  onClick={() => { recordVisit('admission', 'Admission Services'); setAnalytics(getAnalytics()); }}>
                  <div className="db-hl-body">
                    <p className="db-hl-tag">ADMISSIONS</p>
                    <p className="db-hl-name">ECNESIS Portal</p>
                    <p className="db-hl-visits">{analytics.admission || 0} visits</p>
                  </div>
                  <div className="db-hl-art">
                    <svg viewBox="0 0 56 56" fill="none">
                      <path d="M28 10v2M28 44v2M10 28h2M44 28h2" stroke="rgba(255,255,255,0.3)" strokeWidth="1.8" strokeLinecap="round"/>
                      <circle cx="28" cy="28" r="14" stroke="rgba(255,255,255,0.25)" strokeWidth="1.8"/>
                      <path d="M22 28a6 6 0 0112 0" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8"/>
                      <circle cx="28" cy="22" r="3" fill="rgba(255,255,255,0.35)"/>
                    </svg>
                  </div>
                </a>
              </div>
            </div>

            {/* â”€â”€ SERVICES GRID â”€â”€ */}
            <div className="db-panel db-services-panel">
              <div className="db-panel-header">
                <div className="db-panel-header-left">
                  <div className="db-panel-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="db-panel-title">
                      {searchQuery ? `Results for "${searchQuery}"` : 'CDN Portal Services'}
                    </h3>
                    <p className="db-panel-sub">Click a system to access and track visits</p>
                  </div>
                </div>
                {!searchQuery && <span className="db-badge-pill">{SYSTEMS.length} systems</span>}
              </div>

              {filtered.length === 0 ? (
                <div className="db-no-results">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <p>No services found for <strong>"{searchQuery}"</strong></p>
                </div>
              ) : (
                <div className="db-sys-grid">
                  {filtered.map((sys) => {
                    const visits = analytics[sys.id] || 0;
                    return (
                      <button
                        key={sys.id}
                        className="db-sys-card"
                        style={{ '--sc': sys.color, '--sc-bg': sys.bg }}
                        onClick={() => handleSysClick(sys)}
                        aria-label={`Open ${sys.label}`}
                      >
                        {sys.badge && (
                          <span className="db-sys-badge"
                            style={{ background: sys.badge === 'Soon' ? '#f3f4f6' : sys.color,
                                     color: sys.badge === 'Soon' ? '#6b7280' : '#fff' }}>
                            {sys.badge}
                          </span>
                        )}
                        <div className="db-sys-icon-wrap" style={{ background: sys.bg, color: sys.color }}>
                          {sys.icon}
                        </div>
                        <div className="db-sys-info">
                          <p className="db-sys-label">{sys.label}</p>
                          <p className="db-sys-sub">{sys.sub}</p>
                        </div>
                        <div className="db-sys-footer">
                          <span className="db-sys-visits" style={{ color: visits > 0 ? sys.color : '#9ca3af' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                            {visits}
                          </span>
                          <svg className="db-sys-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'activity' && (
          <div className="db-activity-layout">

            {/* Top visited systems */}
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
                    <p className="db-panel-sub">Ranked by total clicks from this portal</p>
                  </div>
                </div>
                <span className="db-badge-pill db-badge-pill--gold">This session</span>
              </div>

              {totalClicks === 0 ? (
                <div className="db-empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                  <p>No system visits recorded yet.</p>
                  <span>Click any system on the Overview tab to start tracking.</span>
                </div>
              ) : (
                <div className="db-top-list">
                  {topSystems.map((sys, idx) => {
                    const pct = totalClicks > 0 ? Math.round((sys.visits / totalClicks) * 100) : 0;
                    return (
                      <div key={sys.id} className="db-top-row">
                        <span className={`db-top-rank db-top-rank--${idx + 1}`}>#{idx + 1}</span>
                        <div className="db-top-icon" style={{ background: sys.bg, color: sys.color }}>
                          {sys.icon}
                        </div>
                        <div className="db-top-info">
                          <div className="db-top-name-row">
                            <span className="db-top-name">{sys.label}</span>
                            <span className="db-top-count" style={{ color: sys.color }}>{sys.visits} visits</span>
                          </div>
                          <div className="db-top-bar-bg">
                            <div className="db-top-bar-fill"
                              style={{ width: `${pct}%`, background: sys.color }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Visit summary + recent activity side by side */}
            <div className="db-activity-cols">

              {/* Summary breakdown */}
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
                      <p className="db-panel-sub">Per-system breakdown</p>
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
                        {analytics[sys.id] || 0}
                      </p>
                      <p className="db-summary-name">{sys.label.split(' ')[0]}</p>
                    </div>
                  ))}
                </div>

                {/* Total row */}
                <div className="db-summary-total">
                  <div>
                    <p className="db-summary-total-label">Total System Clicks</p>
                    <p className="db-summary-total-sub">All systems combined</p>
                  </div>
                  <span className="db-summary-total-val">{totalClicks}</span>
                </div>
              </div>

              {/* Recent activity log */}
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
                      <p className="db-panel-sub">Latest system access log</p>
                    </div>
                  </div>
                  {recentVisits.length > 0 && (
                    <button className="db-clear-btn" onClick={() => {
                      localStorage.removeItem(PAGEVIEW_KEY);
                      setRecentVisits([]);
                    }}>Clear</button>
                  )}
                </div>

                {recentVisits.length === 0 ? (
                  <div className="db-empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <p>No activity yet.</p>
                    <span>System visits will appear here in real-time.</span>
                  </div>
                ) : (
                  <div className="db-activity-log">
                    {recentVisits.slice(0, 20).map((v, i) => {
                      const sys = SYSTEMS.find(s => s.id === v.id || ('banner_' + s.id) === v.id);
                      return (
                        <div key={i} className="db-log-row">
                          <div className="db-log-dot" style={{ background: sys?.color ?? '#9ca3af' }} />
                          <div className="db-log-info">
                            <span className="db-log-label">{v.label}</span>
                            <span className="db-log-sub">{sys?.sub ?? 'Portal access'}</span>
                          </div>
                          <span className="db-log-time">{timeAgo(v.ts)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Portal metrics */}
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
                  { label: 'Total Portal Visits', value: totalPortalVisits, color: '#002280',
                    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
                  { label: 'Visits Today', value: todayVisits, color: '#10813f',
                    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
                  { label: 'Total System Clicks', value: totalClicks, color: '#C8960C',
                    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
                  { label: 'Unique Day Sessions', value: Object.keys(visitorsObj).length, color: '#7c3aed',
                    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
                ].map(m => (
                  <div key={m.label} className="db-metric-card">
                    <div className="db-metric-icon" style={{ color: m.color }}>{m.icon}</div>
                    <p className="db-metric-val" style={{ color: m.color }}>{m.value}</p>
                    <p className="db-metric-label">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* â•â• BOTTOM NAV â•â• */}
      <nav className="db-bottom-nav">
        {[
          { label: 'Home',     active: activeTab === 'overview', tab: 'overview',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
          { label: 'Activity', active: activeTab === 'activity', tab: 'activity',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
          { label: 'Chatbot',  center: true,
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><path d="M8 10h8M8 14h5"/></svg> },
          { label: 'History',  active: activeTab === 'activity', tab: 'activity',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
          { label: 'Account',  active: false,
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
        ].map(item => (
          <button key={item.label}
            className={`db-bnav-item${item.center ? ' db-bnav-item--center' : ''}${item.active ? ' db-bnav-item--active' : ''}`}
            onClick={() => {
              if (item.tab)                 setActiveTab(item.tab);
              if (item.label === 'Chatbot') setChatOpen(true);
              if (item.label === 'Account') { setProfileOpen(true); }
            }}
            aria-label={item.label}>
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* â•â• CHATBOT MODAL â•â• */}
      {chatOpen && (
        <div className="db-chat-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setChatOpen(false); }}>
          <div className="db-chat-panel" role="dialog" aria-label="CDN Portal Assistant">
            {/* Header */}
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
              <button className="db-chat-close" onClick={() => setChatOpen(false)} aria-label="Close chat">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Quick prompts */}
            <div className="db-chat-prompts">
              {['Check fines', 'OSAS records', 'Admission info', 'Login help'].map(p => (
                <button key={p} className="db-chat-prompt"
                  onClick={() => { setChatInput(p); }}>
                  {p}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="db-chat-messages">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`db-chat-msg db-chat-msg--${msg.from}`}>
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

            {/* Input */}
            <form className="db-chat-input-row"
              onSubmit={(e) => { e.preventDefault(); sendChatMessage(); }}>
              <input
                type="text"
                className="db-chat-input"
                placeholder="Ask about fines, OSAS, admissions..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                autoFocus
              />
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
