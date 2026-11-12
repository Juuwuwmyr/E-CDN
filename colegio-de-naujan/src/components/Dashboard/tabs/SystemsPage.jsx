/**
 * SystemsPage — Systems admin tab
 * Stats bar + Usage Analytics table + Recent Access Log + SystemAppsManager
 */
import { useState, useEffect, useCallback } from 'react';
import SystemAppsManager from '../SystemAppsManager';
import {
  getPortalMetrics,
  getSystemVisitStats,
  getRecentSystemVisits,
  subscribeToSystemApplications,
} from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { SYSTEMS, fmt, timeAgo } from '../constants';

/* ── helpers ─────────────────────────────────────────────── */
const catLabel = (key) => {
  const map = {
    academics: 'Academics', admin: 'Admin', finance: 'Finance',
    health: 'Health', library: 'Library', schedule: 'Schedule',
    reports: 'Reports', more: 'More',
  };
  return map[key] ?? key;
};

const CAT_COLORS = {
  academics: { color: '#002280', bg: '#eef1fb' },
  admin:     { color: '#7c3aed', bg: '#f5f0ff' },
  finance:   { color: '#C8960C', bg: '#fdf8ec' },
  health:    { color: '#10813f', bg: '#edf7f1' },
  library:   { color: '#0891b2', bg: '#ecf8fb' },
  schedule:  { color: '#374151', bg: '#f3f4f6' },
  reports:   { color: '#C8102E', bg: '#fdf0f2' },
  more:      { color: '#6b7280', bg: '#f9fafb' },
};

/* ── stat-card icons ─────────────────────────────────────── */
const IconSystems = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M3 5v4c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
    <path d="M3 9v4c0 1.66 4.03 3 9 3s9-1.34 9-3V9"/>
    <path d="M3 13v4c0 1.66 4.03 3 9 3s9-1.34 9-3v-4"/>
  </svg>
);
const IconActive = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IconClicks = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);
const IconTop = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

/* ── AnalyticsRow ─────────────────────────────────────────── */
const AnalyticsRow = ({ app, visitCount, lastVisit, onToggle, toggling }) => {
  const cc = CAT_COLORS[app.category] ?? { color: '#6b7280', bg: '#f3f4f6' };
  return (
    <tr
      style={{
        borderBottom: '1px solid #f3f4f6',
        opacity: app.is_active ? 1 : 0.55,
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* System */}
      <td style={{ padding: '11px 14px', minWidth: 180 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: app.bg || cc.bg, color: app.color || cc.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ width: 15, height: 15 }}>
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#111827' }}>{app.label}</div>
            <span style={{
              fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.04em', background: app.bg || cc.bg,
              color: app.color || cc.color, padding: '1px 6px', borderRadius: 3,
              display: 'inline-block', marginTop: 2,
            }}>{catLabel(app.category)}</span>
          </div>
        </div>
      </td>

      {/* Status */}
      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
        <span style={{
          background: app.is_active ? '#edf7f1' : '#f3f4f6',
          color: app.is_active ? '#10813f' : '#6b7280',
          fontSize: '0.72rem', fontWeight: 700,
          padding: '3px 8px', borderRadius: 20,
          textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>
          {app.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>

      {/* Visits */}
      <td style={{ padding: '11px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>
          {visitCount ?? 0}
        </span>
      </td>

      {/* Last accessed */}
      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
        <span
          title={lastVisit ? new Date(lastVisit).toLocaleString() : '—'}
          style={{ fontSize: '0.8rem', color: '#6b7280', cursor: 'default' }}
        >
          {lastVisit ? timeAgo(new Date(lastVisit).getTime()) : '—'}
        </span>
      </td>

      {/* Actions */}
      <td style={{ padding: '11px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Toggle */}
          <button
            type="button"
            onClick={() => onToggle(app)}
            disabled={toggling}
            title={app.is_active ? 'Deactivate' : 'Activate'}
            style={{
              width: 36, height: 20, borderRadius: 10,
              background: app.is_active ? '#10813f' : '#d1d5db',
              border: 'none', cursor: toggling ? 'not-allowed' : 'pointer',
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}
          >
            <span style={{
              position: 'absolute', top: 2,
              left: app.is_active ? 18 : 2,
              width: 16, height: 16, borderRadius: '50%',
              background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
              transition: 'left 0.2s', display: 'block',
            }}/>
          </button>

          {/* Open link */}
          <a
            href={app.url}
            target="_blank"
            rel="noreferrer"
            title="Open portal"
            style={{
              width: 26, height: 26, display: 'flex', alignItems: 'center',
              justifyContent: 'center', borderRadius: 6,
              background: '#f3f4f6', color: '#374151', textDecoration: 'none',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ width: 13, height: 13 }}>
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </div>
      </td>
    </tr>
  );
};

/* ── Main component ──────────────────────────────────────── */
const SystemsPage = () => {
  const [totalApps,   setTotalApps]   = useState(0);
  const [activeApps,  setActiveApps]  = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [topSystem,   setTopSystem]   = useState(null);
  const [loading,     setLoading]     = useState(true);

  // Analytics table
  const [appList,     setAppList]     = useState([]);
  const [visitStats,  setVisitStats]  = useState({});
  const [lastVisits,  setLastVisits]  = useState({});  // system_id → visited_at
  const [analLoading, setAnalLoading] = useState(true);
  const [togglingId,  setTogglingId]  = useState(null);

  // Recent access log
  const [recentLog,   setRecentLog]   = useState([]);
  const [logLoading,  setLogLoading]  = useState(true);

  /* ── fetch stat cards ───────────────────────────────────── */
  const fetchStats = useCallback(async () => {
    try {
      const { data: appsData } = await supabase
        .from('system_applications')
        .select('id, is_active', { count: 'exact' });

      const all    = appsData?.length ?? 0;
      const active = appsData?.filter(a => a.is_active).length ?? 0;

      const [metrics, vStats] = await Promise.all([
        getPortalMetrics(),
        getSystemVisitStats(),
      ]);

      const topEntry = Object.entries(vStats).sort((a, b) => b[1] - a[1])[0];

      setTotalApps(all);
      setActiveApps(active);
      setTotalClicks(metrics.totalClicks);
      setTopSystem(
        topEntry
          ? {
              id:     topEntry[0],
              label:  SYSTEMS.find(s => s.id === topEntry[0])?.label ?? topEntry[0],
              visits: topEntry[1],
            }
          : null
      );
    } catch (e) {
      console.error('SystemsPage fetchStats:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── fetch analytics table ──────────────────────────────── */
  const fetchAnalytics = useCallback(async () => {
    setAnalLoading(true);
    try {
      const { data: apps } = await supabase
        .from('system_applications')
        .select('*')
        .order('label', { ascending: true });

      const [vStats, recent] = await Promise.all([
        getSystemVisitStats(),
        getRecentSystemVisits(200),
      ]);

      // Build last-visit map: system_id → most recent visited_at
      const lv = {};
      (recent || []).forEach(r => {
        if (!lv[r.system_id] || r.visited_at > lv[r.system_id]) {
          lv[r.system_id] = r.visited_at;
        }
      });

      setAppList(apps || []);
      setVisitStats(vStats);
      setLastVisits(lv);
    } catch (e) {
      console.error('SystemsPage fetchAnalytics:', e);
    } finally {
      setAnalLoading(false);
    }
  }, []);

  /* ── fetch recent log ───────────────────────────────────── */
  const fetchLog = useCallback(async () => {
    setLogLoading(true);
    try {
      const rows = await getRecentSystemVisits(10);
      setRecentLog(rows);
    } catch (e) {
      console.error('SystemsPage fetchLog:', e);
    } finally {
      setLogLoading(false);
    }
  }, []);

  /* ── mount ──────────────────────────────────────────────── */
  useEffect(() => {
    fetchStats();
    fetchAnalytics();
    fetchLog();

    const ch   = subscribeToSystemApplications(() => { fetchStats(); fetchAnalytics(); });
    const poll = setInterval(() => { fetchStats(); fetchAnalytics(); fetchLog(); }, 30000);

    return () => { ch.unsubscribe(); clearInterval(poll); };
  }, [fetchStats, fetchAnalytics, fetchLog]);

  /* ── inline toggle (analytics table) ───────────────────── */
  const handleToggle = async (app) => {
    setTogglingId(app.id);
    try {
      const { error } = await supabase
        .from('system_applications')
        .update({ is_active: !app.is_active })
        .eq('id', app.id);
      if (error) throw error;
      setAppList(prev => prev.map(a => a.id === app.id ? { ...a, is_active: !a.is_active } : a));
      // Refresh stat cards silently
      fetchStats();
    } catch (e) {
      console.error('Toggle error:', e);
    } finally {
      setTogglingId(null);
    }
  };

  /* ── stat cards ─────────────────────────────────────────── */
  const STAT_CARDS = [
    {
      label: 'Total Systems',
      value: loading ? '…' : totalApps,
      sub:   'registered portals',
      color: '#002280', bg: '#eef1fb',
      icon: <IconSystems />,
    },
    {
      label: 'Active Systems',
      value: loading ? '…' : activeApps,
      sub:   loading ? '…' : `${totalApps - activeApps} inactive`,
      color: '#10813f', bg: '#edf7f1',
      icon: <IconActive />,
    },
    {
      label: 'Total Access Clicks',
      value: loading ? '…' : fmt(totalClicks),
      sub:   'all-time visits',
      color: '#C8960C', bg: '#fdf8ec',
      icon: <IconClicks />,
    },
    {
      label: 'Most Accessed System',
      value: loading ? '…' : (topSystem?.label ?? 'None'),
      sub:   loading ? '…' : (topSystem ? `${topSystem.visits} clicks` : 'No visits yet'),
      color: '#7c3aed', bg: '#f5f0ff',
      icon: <IconTop />,
    },
  ];

  /* ── get dot color for log row ──────────────────────────── */
  const dotColor = (systemId) => {
    const app = appList.find(a => a.id === systemId);
    return app?.color ?? '#002280';
  };

  /* ── render ──────────────────────────────────────────────── */
  return (
    <div className="db-home-content">

      {/* ── Stat cards ──────────────────────────────────────── */}
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

      {/* ── Usage Analytics ─────────────────────────────────── */}
      <div className="db-panel" style={{ marginTop: 24 }}>
        <div className="db-panel-header">
          <div className="db-panel-header-left">
            <div className="db-panel-icon" style={{ background: '#eef1fb', color: '#002280' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6"  y1="20" x2="6"  y2="14"/>
                <line x1="2"  y1="20" x2="22" y2="20"/>
              </svg>
            </div>
            <div>
              <h3 className="db-panel-title">Usage Analytics</h3>
              <p className="db-panel-sub">Per-system visit counts and status overview</p>
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['System', 'Status', 'Total Visits', 'Last Accessed', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: h === 'Total Visits' ? 'right' : 'left',
                    fontSize: '0.73rem', fontWeight: 700, color: '#6b7280',
                    textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analLoading ? (
                Array.from({ length: 4 }, (_, i) => (
                  <tr key={i}>
                    {[200, 90, 80, 100, 80].map((w, j) => (
                      <td key={j} style={{ padding: '14px 14px' }}>
                        <div style={{
                          height: 13, width: w, borderRadius: 5,
                          background: 'linear-gradient(90deg,#f0f0f0 25%,#e4e4e4 50%,#f0f0f0 75%)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 1.4s infinite linear',
                        }}/>
                      </td>
                    ))}
                  </tr>
                ))
              ) : appList.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '36px 14px', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                    No applications registered yet.
                  </td>
                </tr>
              ) : (
                appList.map(app => (
                  <AnalyticsRow
                    key={app.id}
                    app={app}
                    visitCount={visitStats[app.id] ?? 0}
                    lastVisit={lastVisits[app.id] ?? null}
                    onToggle={handleToggle}
                    toggling={togglingId === app.id}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Recent Access Log ───────────────────────────────── */}
      <div className="db-panel" style={{ marginTop: 24 }}>
        <div className="db-panel-header">
          <div className="db-panel-header-left">
            <div className="db-panel-icon" style={{ background: '#edf7f1', color: '#10813f' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div>
              <h3 className="db-panel-title">Recent Access Log</h3>
              <p className="db-panel-sub">Last 10 system visits — auto-refreshes every 30s</p>
            </div>
          </div>
          {/* Live badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: '#edf7f1', color: '#10813f',
              fontSize: '0.72rem', fontWeight: 700,
              padding: '4px 10px', borderRadius: 20,
              letterSpacing: '0.04em',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', background: '#10813f',
                animation: 'live-pulse 1.6s ease-in-out infinite',
                display: 'inline-block',
              }}/>
              LIVE
            </span>
          </div>
        </div>

        <style>{`
          @keyframes shimmer {
            0%   { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          @keyframes live-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50%       { opacity: 0.4; transform: scale(1.4); }
          }
        `}</style>

        {logLoading ? (
          <div style={{ padding: '20px 0' }}>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e5e7eb', flexShrink: 0 }}/>
                <div style={{ height: 13, width: 180, borderRadius: 5, background: 'linear-gradient(90deg,#f0f0f0 25%,#e4e4e4 50%,#f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite linear' }}/>
                <div style={{ height: 13, width: 90, borderRadius: 5, background: 'linear-gradient(90deg,#f0f0f0 25%,#e4e4e4 50%,#f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite linear', marginLeft: 'auto' }}/>
              </div>
            ))}
          </div>
        ) : recentLog.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
            No access events recorded yet.
          </div>
        ) : (
          <div style={{ marginTop: 4 }}>
            {recentLog.map((row, i) => (
              <div
                key={row.id ?? i}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 4px', borderBottom: '1px solid #f3f4f6',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Colored dot */}
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: dotColor(row.system_id),
                  flexShrink: 0, display: 'inline-block',
                }}/>

                {/* System name */}
                <span style={{ fontWeight: 600, fontSize: '0.84rem', color: '#111827', flex: '0 0 auto' }}>
                  {row.system_label || row.system_id}
                </span>

                {/* User */}
                <span style={{ fontSize: '0.78rem', color: '#9ca3af', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.user_id ? (
                    <span style={{ color: '#6b7280' }}>{row.user_id}</span>
                  ) : (
                    <span style={{ fontStyle: 'italic' }}>Anonymous</span>
                  )}
                </span>

                {/* Timestamp */}
                <span
                  title={row.visited_at ? new Date(row.visited_at).toLocaleString() : ''}
                  style={{ fontSize: '0.78rem', color: '#9ca3af', flexShrink: 0, cursor: 'default' }}
                >
                  {row.visited_at ? timeAgo(new Date(row.visited_at).getTime()) : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Systems Application Manager ─────────────────────── */}
      <SystemAppsManager />
    </div>
  );
};

export default SystemsPage;
