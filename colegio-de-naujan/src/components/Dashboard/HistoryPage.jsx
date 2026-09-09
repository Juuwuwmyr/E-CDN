import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/dashboard.css';

const PAGEVIEW_KEY  = 'cdn_pageviews';
const ANALYTICS_KEY = 'cdn_analytics';

const SYSTEMS = [
  { id: 'csc',       label: 'CSC Services',       color: '#002280' },
  { id: 'osas',      label: 'OSAS Services',       color: '#C8102E' },
  { id: 'admission', label: 'Admission Services',  color: '#C8960C' },
];

const timeAgo = (ts) => {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)    return diff + 's ago';
  if (diff < 3600)  return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
};

const formatDate = (ts) =>
  new Date(ts).toLocaleDateString('en-PH', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const HistoryPage = ({ user }) => {
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);

  useEffect(() => {
    try {
      setVisits(JSON.parse(localStorage.getItem(PAGEVIEW_KEY)) || []);
    } catch { setVisits([]); }
  }, []);

  const clearHistory = () => {
    localStorage.removeItem(PAGEVIEW_KEY);
    setVisits([]);
  };

  return (
    <div className="db-root">
      {/* TOPBAR */}
      <header className="db-topbar">
        <div className="db-topbar-inner">
          <button
            className="db-back-btn"
            onClick={() => navigate('/dashboard')}
            aria-label="Back to Dashboard"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0F1422' }}>Visit History</span>
          </div>
          <div style={{ width: 64 }} />
        </div>
      </header>

      <main className="db-main" style={{ paddingBottom: 90 }}>

        {/* Header panel */}
        <div className="db-panel" style={{ marginBottom: 0 }}>
          <div className="db-panel-header">
            <div className="db-panel-header-left">
              <div className="db-panel-icon db-panel-icon--green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div>
                <h3 className="db-panel-title">Access History</h3>
                <p className="db-panel-sub">{visits.length} record{visits.length !== 1 ? 's' : ''} logged</p>
              </div>
            </div>
            {visits.length > 0 && (
              <button className="db-clear-btn" onClick={clearHistory}>
                Clear All
              </button>
            )}
          </div>

          {visits.length === 0 ? (
            <div className="db-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <p>No history yet.</p>
              <span>System visits will appear here once you access a portal.</span>
            </div>
          ) : (
            <div className="db-activity-log">
              {visits.map((v, i) => {
                const sys = SYSTEMS.find(s => s.id === v.id);
                return (
                  <div key={i} className="db-log-row">
                    <div className="db-log-dot" style={{ background: sys?.color ?? '#9ca3af' }} />
                    <div className="db-log-info">
                      <span className="db-log-label">{v.label}</span>
                      <span className="db-log-sub">{formatDate(v.ts)}</span>
                    </div>
                    <span className="db-log-time">{timeAgo(v.ts)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

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
        <button className="db-bnav-item db-bnav-item--active" aria-label="History">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>History</span>
        </button>
        <button className="db-bnav-item" onClick={() => navigate('/dashboard/account')} aria-label="Account">
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

export default HistoryPage;
