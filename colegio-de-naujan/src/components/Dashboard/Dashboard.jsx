import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/dashboard.css';
import cdnLogo from '../../assets/images/logo.png';
import bagongPilipinasLogo from '../../assets/images/bagong-pilipinas-seeklogo.png';

/* ── Static data ─────────────────────────── */

const SYSTEMS = [
  {
    id: 'csc',
    label: 'CSC Services',
    sub: 'Fines Management System',
    url: 'https://student-fines-hub-vf9z.vercel.app/',
    color: '#002280',
    bg: '#eef1fb',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
        <path d="M7 8h10M7 12h6"/>
      </svg>
    ),
    badge: null,
  },
  {
    id: 'osas',
    label: 'OSAS Services',
    sub: 'Violation Tracking System',
    url: 'https://osas-sys.duckdns.org/',
    color: '#C8102E',
    bg: '#fdf0f2',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
    ),
    badge: null,
  },
  {
    id: 'admission',
    label: 'Admission Services',
    sub: 'Admissions Office Portal',
    url: 'https://ecnesis.duckdns.org/',
    color: '#C8960C',
    bg: '#fdf8ec',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
    badge: 'New',
  },
  {
    id: 'student',
    label: 'Student Portal',
    sub: 'Grades & Enrollment',
    url: '#',
    color: '#10813f',
    bg: '#edf7f1',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
    badge: null,
  },
  {
    id: 'library',
    label: 'Library System',
    sub: 'Digital Library & Catalog',
    url: '#',
    color: '#7c3aed',
    bg: '#f5f0ff',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
        <path d="M9 7h6M9 11h4"/>
      </svg>
    ),
    badge: 'Soon',
  },
  {
    id: 'faculty',
    label: 'Faculty Portal',
    sub: 'Schedules & Attendance',
    url: '#',
    color: '#0891b2',
    bg: '#ecf8fb',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <path d="M16 2v4M8 2v4M3 10h18"/>
        <path d="M8 14h2M12 14h4M8 18h2M12 18h2"/>
      </svg>
    ),
    badge: null,
  },
  {
    id: 'finance',
    label: 'Finance Office',
    sub: 'Payments & Clearance',
    url: '#',
    color: '#dc6803',
    bg: '#fff4e8',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    ),
    badge: null,
  },
  {
    id: 'health',
    label: 'Health Services',
    sub: 'Medical Records & Clinic',
    url: '#',
    color: '#e11d48',
    bg: '#fff0f3',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        <path d="M12 8v8M8 12h8"/>
      </svg>
    ),
    badge: null,
  },
];

const CATEGORY_ICONS = [
  {
    key: 'academics',
    label: 'Academics',
    color: '#002280',
    bg: '#eef1fb',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
  },
  {
    key: 'admin',
    label: 'Admin',
    color: '#C8102E',
    bg: '#fdf0f2',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    key: 'finance',
    label: 'Finance',
    color: '#C8960C',
    bg: '#fdf8ec',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    ),
  },
  {
    key: 'health',
    label: 'Health',
    color: '#e11d48',
    bg: '#fff0f3',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
      </svg>
    ),
  },
  {
    key: 'library',
    label: 'Library',
    color: '#7c3aed',
    bg: '#f5f0ff',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
      </svg>
    ),
  },
  {
    key: 'schedule',
    label: 'Schedule',
    color: '#0891b2',
    bg: '#ecf8fb',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
  },
  {
    key: 'report',
    label: 'Reports',
    color: '#6b7280',
    bg: '#f3f4f6',
    badge: 'New',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    key: 'more',
    label: 'More',
    color: '#374151',
    bg: '#f9fafb',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
      </svg>
    ),
  },
];

const BANNERS = [
  {
    id: 0,
    tag: 'NEW SYSTEM',
    title: 'Admissions Portal',
    sub: 'Apply online — faster, paperless enrollment for AY 2026–2027.',
    cta: 'Apply Now',
    url: 'https://ecnesis.duckdns.org/',
    bg: 'linear-gradient(120deg, #002280 0%, #0044cc 100%)',
    accent: '#FFD700',
  },
  {
    id: 1,
    tag: 'CSC SERVICES',
    title: 'Fines Management',
    sub: 'View and settle your outstanding student fines online, anytime.',
    cta: 'Check Fines',
    url: 'https://student-fines-hub-vf9z.vercel.app/',
    bg: 'linear-gradient(120deg, #7c3aed 0%, #5b21b6 100%)',
    accent: '#fbbf24',
  },
  {
    id: 2,
    tag: 'OSAS',
    title: 'Violation Tracking',
    sub: 'Monitor and resolve student conduct records through OSAS.',
    cta: 'View Records',
    url: 'https://osas-sys.duckdns.org/',
    bg: 'linear-gradient(120deg, #C8102E 0%, #9b0921 100%)',
    accent: '#fde68a',
  },
];

/* ── Helpers ── */
const getDayDate = () => {
  const now = new Date();
  return now.toLocaleDateString('en-PH', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

/* ══════════════════════════════════════════
   Dashboard Component
   ══════════════════════════════════════════ */
const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery]   = useState('');
  const [bannerIdx, setBannerIdx]       = useState(0);
  const [profileOpen, setProfileOpen]   = useState(false);
  const [notifOpen, setNotifOpen]       = useState(false);
  const bannerTimer = useRef(null);
  const profileRef  = useRef(null);
  const notifRef    = useRef(null);

  /* Auto-advance banner */
  useEffect(() => {
    bannerTimer.current = setInterval(() => {
      setBannerIdx((i) => (i + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(bannerTimer.current);
  }, []);

  /* Close dropdowns on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current  && !notifRef.current.contains(e.target))  setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('cdn_user');
    onLogout();
    navigate('/', { replace: true });
  };

  /* Search filter */
  const filteredSystems = searchQuery.trim()
    ? SYSTEMS.filter(
        (s) =>
          s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.sub.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : SYSTEMS;

  const banner = BANNERS[bannerIdx];

  return (
    <div className="db-root">

      {/* ══ TOP NAVIGATION BAR ══ */}
      <header className="db-topbar">
        <div className="db-topbar-inner">

          {/* Left: Logo + wordmark */}
          <div className="db-topbar-brand">
            <img src={cdnLogo} alt="CDN" className="db-topbar-logo" />
            <div className="db-topbar-wordmark">
              <span className="db-topbar-school">CDN</span>
              <span className="db-topbar-portal">E-Portal</span>
            </div>
          </div>

          {/* Center: Location + date */}
          <div className="db-topbar-meta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="10" r="3"/>
              <path d="M12 2a8 8 0 010 16c-4 0-8-5.37-8-8a8 8 0 0116 0z"/>
            </svg>
            <span>Naujan, Oriental Mindoro</span>
            <span className="db-topbar-sep">·</span>
            <span>{getDayDate()}</span>
          </div>

          {/* Right: Notif + profile */}
          <div className="db-topbar-actions">

            {/* Notification bell */}
            <div className="db-notif-wrap" ref={notifRef}>
              <button
                className="db-icon-btn"
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                aria-label="Notifications"
              >
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
                    { text: 'Admissions portal is now live', time: '2 hrs ago', dot: '#002280' },
                    { text: 'OSAS records updated for AY 2026', time: 'Yesterday', dot: '#C8102E' },
                    { text: 'New fines posted by CSC', time: '3 days ago', dot: '#C8960C' },
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
              <button
                className="db-profile-btn"
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                aria-label="Account menu"
              >
                <div className="db-avatar">
                  {user?.name?.charAt(0).toUpperCase() ?? 'U'}
                </div>
                <div className="db-profile-text">
                  <span className="db-profile-greeting">
                    {getGreeting()},&nbsp;<strong>{user?.name?.split(' ')[0] ?? 'User'}</strong>
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
                    <div className="db-avatar db-avatar--lg">
                      {user?.name?.charAt(0).toUpperCase() ?? 'U'}
                    </div>
                    <div>
                      <p className="db-pp-name">{user?.name}</p>
                      <p className="db-pp-role">{user?.role}</p>
                    </div>
                  </div>
                  <div className="db-dropdown-divider" />
                  {[
                    { icon: '👤', label: 'My Profile' },
                    { icon: '⚙️', label: 'Settings' },
                    { icon: '❓', label: 'Help & Support' },
                  ].map((item) => (
                    <button key={item.label} className="db-dropdown-item">
                      <span>{item.icon}</span> {item.label}
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

      {/* ══ MAIN SCROLL AREA ══ */}
      <main className="db-main">

        {/* ── Greeting strip ── */}
        <div className="db-greeting-strip">
          <div className="db-greeting-strip-inner">
            <div>
              <p className="db-greeting-text">
                {getGreeting()}, <strong>{user?.name ?? 'User'}</strong>
              </p>
              <p className="db-greeting-sub">
                Welcome to CDN E-Portal — your gateway to all Colegio De Naujan systems.
              </p>
            </div>
            <img src={bagongPilipinasLogo} alt="Bagong Pilipinas" className="db-greeting-bp" />
          </div>
        </div>

        {/* ── Search bar ── */}
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
              <button
                className="db-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* ── Category icons row (eGovPH style) ── */}
        <div className="db-section">
          <div className="db-cat-scroll">
            {CATEGORY_ICONS.map((cat) => (
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

        {/* ── Banner carousel (eGovPH hero banners) ── */}
        <div className="db-section">
          <div className="db-banner" style={{ background: banner.bg }}>
            <div className="db-banner-content">
              <span className="db-banner-tag" style={{ color: banner.accent }}>
                {banner.tag}
              </span>
              <h2 className="db-banner-title">{banner.title}</h2>
              <p className="db-banner-sub">{banner.sub}</p>
              <a
                href={banner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="db-banner-cta"
                style={{ background: banner.accent, color: '#0f1724' }}
              >
                {banner.cta}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
            </div>
            <div className="db-banner-deco" aria-hidden="true">
              <svg viewBox="0 0 120 120" fill="none">
                <circle cx="60" cy="60" r="55" stroke="rgba(255,255,255,0.08)" strokeWidth="2"/>
                <circle cx="60" cy="60" r="38" stroke="rgba(255,255,255,0.06)" strokeWidth="2"/>
                <circle cx="60" cy="60" r="20" stroke="rgba(255,255,255,0.1)" strokeWidth="2"/>
              </svg>
            </div>
          </div>

          {/* Dots */}
          <div className="db-banner-dots">
            {BANNERS.map((_, i) => (
              <button
                key={i}
                className={`db-banner-dot${bannerIdx === i ? ' db-banner-dot--active' : ''}`}
                onClick={() => {
                  setBannerIdx(i);
                  clearInterval(bannerTimer.current);
                  bannerTimer.current = setInterval(() => setBannerIdx((x) => (x + 1) % BANNERS.length), 5000);
                }}
                aria-label={`Go to banner ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* ── Two featured highlight cards (like eGovPH eTrabaho / eGovAI) ── */}
        <div className="db-section">
          <div className="db-highlight-grid">
            <a href="https://student-fines-hub-vf9z.vercel.app/" target="_blank" rel="noopener noreferrer" className="db-highlight-card db-highlight-card--blue">
              <div className="db-highlight-card-body">
                <p className="db-highlight-tag">CSC</p>
                <p className="db-highlight-name">Student Fines Hub</p>
              </div>
              <div className="db-highlight-art">
                <svg viewBox="0 0 60 60" fill="none">
                  <rect x="8" y="12" width="44" height="36" rx="4" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
                  <path d="M20 24h20M20 32h12" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="44" cy="44" r="10" fill="rgba(255,215,0,0.25)" stroke="#FFD700" strokeWidth="1.5"/>
                  <path d="M44 40v4l2 2" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </a>

            <a href="https://osas-sys.duckdns.org/" target="_blank" rel="noopener noreferrer" className="db-highlight-card db-highlight-card--red">
              <div className="db-highlight-card-body">
                <p className="db-highlight-tag">OSAS</p>
                <p className="db-highlight-name">Violation Tracker</p>
              </div>
              <div className="db-highlight-art">
                <svg viewBox="0 0 60 60" fill="none">
                  <path d="M30 8L8 18v14c0 12 10 22 22 26 12-4 22-14 22-26V18L30 8z" stroke="rgba(255,255,255,0.35)" strokeWidth="2"/>
                  <path d="M22 30l5 5 11-11" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </a>
          </div>
        </div>

        {/* ── Featured eGovPH Services heading ── */}
        <div className="db-section">
          <div className="db-section-header">
            <h3 className="db-section-title">
              {searchQuery ? `Results for "${searchQuery}"` : 'CDN Portal Services'}
            </h3>
            {!searchQuery && (
              <span className="db-section-count">{SYSTEMS.length} systems</span>
            )}
          </div>

          {filteredSystems.length === 0 ? (
            <div className="db-no-results">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p>No services found for <strong>"{searchQuery}"</strong></p>
            </div>
          ) : (
            <div className="db-systems-grid">
              {filteredSystems.map((sys) => (
                <a
                  key={sys.id}
                  href={sys.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="db-sys-card"
                  style={{ '--sys-color': sys.color, '--sys-bg': sys.bg }}
                >
                  {sys.badge && (
                    <span
                      className="db-sys-badge"
                      style={{
                        background: sys.badge === 'Soon' ? '#f3f4f6' : sys.color,
                        color: sys.badge === 'Soon' ? '#6b7280' : '#fff',
                      }}
                    >
                      {sys.badge}
                    </span>
                  )}

                  <div className="db-sys-icon" style={{ background: sys.bg, color: sys.color }}>
                    {sys.icon}
                  </div>

                  <div className="db-sys-info">
                    <p className="db-sys-label">{sys.label}</p>
                    <p className="db-sys-sub">{sys.sub}</p>
                  </div>

                  <div className="db-sys-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* ── Bottom nav bar (eGovPH mobile style) ── */}
        <nav className="db-bottom-nav">
          {[
            {
              label: 'Home',
              active: true,
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              ),
            },
            {
              label: 'Scan QR',
              active: false,
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                  <path d="M14 14h3v3M17 14v7M14 21h7"/>
                </svg>
              ),
            },
            {
              label: 'Digital ID',
              active: false,
              center: true,
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2"/>
                  <circle cx="8" cy="12" r="2.5"/>
                  <path d="M14 10h4M14 14h2"/>
                </svg>
              ),
            },
            {
              label: 'History',
              active: false,
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              ),
            },
            {
              label: 'Account',
              active: false,
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              ),
            },
          ].map((item) => (
            <button
              key={item.label}
              className={`db-bnav-item${item.center ? ' db-bnav-item--center' : ''}${item.active ? ' db-bnav-item--active' : ''}`}
              onClick={item.label === 'Account' ? handleLogout : undefined}
              aria-label={item.label}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

      </main>
    </div>
  );
};

export default Dashboard;
