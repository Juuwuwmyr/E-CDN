/**
 * OverviewPage — "Home" tab content
 * Shows: hero banner, stat cards, login analytics, top-visited systems, access log.
 */
import { useState, useEffect } from 'react';
import LoginAnalytics from '../LoginAnalytics';
import { HeroBanner } from '../DashboardShell';
import { SYSTEMS, fmt } from '../constants';
import {
  recordSystemVisit,
  getSystemVisitStats,
  getRecentSystemVisits,
  getPortalMetrics,
  subscribeToSystemVisits,
} from '../../../lib/auth';
import { logActivity } from '../../../lib/activityLogger';

/* ── local analytics (localStorage) ─────────────────────── */
const ANALYTICS_KEY = 'cdn_analytics';
const PAGEVIEW_KEY  = 'cdn_pageviews';

const getAnalytics  = () => { try { return JSON.parse(localStorage.getItem(ANALYTICS_KEY)) || {}; } catch { return {}; } };
const saveAnalytics = (d) => localStorage.setItem(ANALYTICS_KEY, JSON.stringify(d));

const recordPortalVisit = () => {
  const a = getAnalytics();
  a.__portal = (a.__portal || 0) + 1;
  const today = new Date().toISOString().slice(0, 10);
  a.__visitors = { ...(a.__visitors || {}), [today]: ((a.__visitors || {})[today] || 0) + 1 };
  saveAnalytics(a);
};

const recordLocalVisit = (id, label) => {
  const a = getAnalytics();
  a[id] = (a[id] || 0) + 1;
  saveAnalytics(a);
  const views = JSON.parse(localStorage.getItem(PAGEVIEW_KEY) || '[]');
  views.unshift({ id, label, ts: Date.now() });
  localStorage.setItem(PAGEVIEW_KEY, JSON.stringify(views.slice(0, 200)));
};

const OverviewPage = ({ user }) => {
  const [dbVisitStats,    setDbVisitStats]    = useState({});
  const [dbRecentVisits,  setDbRecentVisits]  = useState([]);
  const [dbPortalMetrics, setDbPortalMetrics] = useState({ totalSessions: 0, todaySessions: 0, totalClicks: 0 });
  const [loading,         setLoading]         = useState(true);

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
      setLoading(false);
    }
  };

  useEffect(() => {
    recordPortalVisit();
    fetchActivity();
    const channel = subscribeToSystemVisits(() => fetchActivity());
    const poll    = setInterval(() => fetchActivity(), 5000);
    return () => { channel.unsubscribe(); clearInterval(poll); };
  }, []);

  const handleSysClick = async (sys) => {
    if (sys.url === '#') return;
    recordLocalVisit(sys.id, sys.label);
    try {
      await recordSystemVisit(sys.id, sys.label, user?.username ?? null);
      await logActivity('system_access', 'Accessed', user?.username ?? 'anonymous', 'success', sys.label);
    } catch (e) {
      console.error('handleSysClick error:', e);
    }
    window.open(sys.url, '_blank', 'noopener,noreferrer');
  };

  /* derived */
  const topSystems = SYSTEMS
    .map(s => ({ ...s, visits: dbVisitStats[s.id] || 0 }))
    .sort((a, b) => b.visits - a.visits);

  const mostVisited = topSystems[0]?.visits > 0 ? topSystems[0] : null;

  /* stat cards config */
  const STAT_CARDS = [
    {
      label: 'Total Login Sessions',
      value: loading ? '…' : fmt(dbPortalMetrics.totalSessions),
      sub:   (loading ? '…' : dbPortalMetrics.todaySessions) + ' today',
      color: '#002280', bg: '#eef1fb',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    },
    {
      label: 'System Clicks',
      value: loading ? '…' : fmt(dbPortalMetrics.totalClicks),
      sub:   'across all services',
      color: '#C8960C', bg: '#fdf8ec',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    },
    {
      label: 'Most Visited',
      value: loading ? '…' : (mostVisited?.label.split(' ')[0] ?? 'None'),
      sub:   loading ? '…' : (mostVisited ? mostVisited.visits + ' clicks' : 'No activity yet'),
      color: '#10813f', bg: '#edf7f1',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    },
    {
      label: 'Active Systems',
      value: SYSTEMS.length,
      sub:   'live portals',
      color: '#7c3aed', bg: '#f5f0ff',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
    },
  ];

  return (
    <>
      {/* Hero banner */}
      <HeroBanner user={user} />

      <div className="db-home-content">

        {/* Stat cards */}
        <div className="db-stats-row">
          {STAT_CARDS.map(s => (
            <div key={s.label} className="db-stat-card" style={{ '--sc': s.color, '--sc-bg': s.bg }}>
              <div className="db-stat-icon" style={{ background: s.bg, color: s.color }}>
                {s.icon}
              </div>
              <div className="db-stat-body">
                <p className="db-stat-value">{s.value}</p>
                <p className="db-stat-label">{s.label}</p>
                <p className="db-stat-sub">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Live login analytics */}
        <LoginAnalytics />

        {/* Top visited systems */}
        <div className="db-panel" style={{ marginTop: 24 }}>
          <div className="db-panel-header">
            <div className="db-panel-header-left">
              <div className="db-panel-icon db-panel-icon--gold">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              </div>
              <h3 className="db-panel-title">Top Visited Systems</h3>
            </div>
            <span className="db-badge-pill db-badge-pill--gold">All time</span>
          </div>

          {loading ? (
            <div className="db-empty-state"><p>Loading…</p></div>
          ) : dbPortalMetrics.totalClicks === 0 ? (
            <div className="db-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              <p>No system visits recorded yet.</p>
              <span>Visits will appear here when students click any service.</span>
            </div>
          ) : (
            <div className="db-top-list">
              {topSystems.map((sys, idx) => {
                const pct = dbPortalMetrics.totalClicks > 0
                  ? Math.round((sys.visits / dbPortalMetrics.totalClicks) * 100) : 0;
                return (
                  <div key={sys.id} className="db-top-row">
                    <span className={'db-top-rank db-top-rank--' + (idx + 1)}>#{idx + 1}</span>
                    <div className="db-top-icon" style={{ color: sys.color }}>{sys.icon}</div>
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

        {/* Recent access log */}
        <div className="db-activity-cols" style={{ marginTop: 24 }}>
          <div className="db-panel">
            <div className="db-panel-header">
              <div className="db-panel-header-left">
                <div className="db-panel-icon db-panel-icon--green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <h3 className="db-panel-title">Student System Access Log</h3>
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

            {loading ? (
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
                  const timeStr = diffMin < 1   ? 'just now'
                    : diffMin < 60   ? diffMin + 'm ago'
                    : diffMin < 1440 ? Math.floor(diffMin / 60) + 'h ago'
                    : new Date(v.visited_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return (
                    <div key={v.id ?? i} className="db-log-row">
                      <div className="db-log-dot" style={{ background: sys?.color ?? '#9ca3af' }} />
                      <div className="db-log-info">
                        <span className="db-log-label">{v.system_label}</span>
                        <span className="db-log-sub">{v.user_id ? 'by ' + v.user_id : 'anonymous visit'}</span>
                      </div>
                      <span className="db-log-time">{timeStr}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
};

export default OverviewPage;
