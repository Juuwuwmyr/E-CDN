import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/dashboard.css';
import cdnLogo from '../../assets/images/logo.png';

const ANALYTICS_KEY = 'cdn_analytics';
const PAGEVIEW_KEY  = 'cdn_pageviews';

const getAnalytics = () => {
  try { return JSON.parse(localStorage.getItem(ANALYTICS_KEY)) || {}; }
  catch { return {}; }
};

const SYSTEMS = [
  { id: 'csc',       label: 'CSC Services',      color: '#002280', url: 'https://student-fines-hub-vf9z.vercel.app/' },
  { id: 'osas',      label: 'OSAS Services',      color: '#C8102E', url: 'https://osas-sys.duckdns.org/' },
  { id: 'admission', label: 'Admission Services', color: '#C8960C', url: 'https://ecnesis.duckdns.org/' },
];

const AccountPage = ({ user, onLogout }) => {
  const navigate   = useNavigate();
  const analytics  = getAnalytics();
  const totalClicks = SYSTEMS.reduce((s, sys) => s + (analytics[sys.id] || 0), 0);
  const totalVisits = analytics.__portal || 0;
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('cdn_user');
    onLogout();
    navigate('/');
  };

  const initial = user?.name?.charAt(0).toUpperCase() ?? 'U';

  return (
    <div className="db-root">
      {/* TOPBAR */}
      <header className="db-topbar">
        <div className="db-topbar-inner">
          <button
            className="db-back-btn"
            onClick={() => navigate('/dashboard')}
            aria-label="Back"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0F1422' }}>My Account</span>
          </div>
          <div style={{ width: 64 }} />
        </div>
      </header>

      <main className="db-main" style={{ paddingBottom: 90 }}>

        {/* Profile card */}
        <div className="db-panel db-account-profile-card">
          <div className="db-account-avatar-wrap">
            <div className="db-account-avatar">{initial}</div>
            <div className="db-account-avatar-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>
          <h2 className="db-account-name">{user?.name ?? 'User'}</h2>
          <p className="db-account-role">{user?.role ?? 'Member'}</p>
          <p className="db-account-school">Colegio De Naujan</p>
          <div className="db-account-stats">
            <div className="db-account-stat">
              <span className="db-account-stat-val" style={{ color: '#002280' }}>{totalVisits}</span>
              <span className="db-account-stat-label">Portal Visits</span>
            </div>
            <div className="db-account-stat-divider" />
            <div className="db-account-stat">
              <span className="db-account-stat-val" style={{ color: '#C8960C' }}>{totalClicks}</span>
              <span className="db-account-stat-label">System Clicks</span>
            </div>
            <div className="db-account-stat-divider" />
            <div className="db-account-stat">
              <span className="db-account-stat-val" style={{ color: '#10813f' }}>{SYSTEMS.length}</span>
              <span className="db-account-stat-label">Systems</span>
            </div>
          </div>
        </div>

        {/* Account details */}
        <div className="db-panel">
          <p className="db-account-section-label">Account Details</p>
          {[
            {
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
              label: 'Full Name', value: user?.name ?? '—',
            },
            {
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
              label: 'Role', value: user?.role ?? '—',
            },
            {
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
              label: 'Email', value: user?.email ?? 'Not provided',
            },
            {
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
              label: 'Academic Year', value: 'AY 2026 – 2027',
            },
          ].map((row) => (
            <div key={row.label} className="db-account-row">
              <div className="db-account-row-icon">{row.icon}</div>
              <div className="db-account-row-body">
                <span className="db-account-row-label">{row.label}</span>
                <span className="db-account-row-value">{row.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="db-panel">
          <p className="db-account-section-label">Quick Access</p>
          {SYSTEMS.map(sys => (
            <a key={sys.id} href={sys.url} target="_blank" rel="noopener noreferrer"
              className="db-account-row db-account-link-row" style={{ textDecoration: 'none' }}>
              <div className="db-account-row-icon" style={{ color: sys.color }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                </svg>
              </div>
              <div className="db-account-row-body">
                <span className="db-account-row-label">{sys.label}</span>
                <span className="db-account-row-value" style={{ color: sys.color }}>
                  {analytics[sys.id] || 0} visits
                </span>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ width: 16, height: 16, flexShrink: 0 }}>
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          ))}
        </div>

        {/* Danger zone */}
        <div className="db-panel">
          <p className="db-account-section-label">Session</p>
          <button
            className="db-account-logout-btn"
            onClick={() => setShowConfirm(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>

      </main>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="db-chat-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfirm(false); }}>
          <div className="db-panel" style={{ maxWidth: 320, margin: '0 1.5rem', padding: '1.5rem' }}>
            <p style={{ fontWeight: 800, fontSize: '1rem', color: '#0F1422', marginBottom: 6 }}>Sign out?</p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 20 }}>
              You will be redirected to the public site.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{ flex: 1, padding: '0.65rem', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                style={{ flex: 1, padding: '0.65rem', borderRadius: 8, border: 'none', background: '#C8102E', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <nav className="db-bottom-nav">
        <button className="db-bnav-item" onClick={() => navigate('/dashboard')} aria-label="Home">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span>Home</span>
        </button>
        <button className="db-bnav-item" onClick={() => navigate('/dashboard?tab=activity')} aria-label="Activity">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          <span>Activity</span>
        </button>
        <button className="db-bnav-item db-bnav-item--center" onClick={() => navigate('/dashboard')} aria-label="Chatbot">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          <span>Chatbot</span>
        </button>
        <button className="db-bnav-item" onClick={() => navigate('/dashboard/history')} aria-label="History">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>History</span>
        </button>
        <button className="db-bnav-item db-bnav-item--active" aria-label="Account">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span>Account</span>
        </button>
      </nav>
    </div>
  );
};

export default AccountPage;
