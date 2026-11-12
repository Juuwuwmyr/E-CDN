/**
 * OverviewPage — Professional institutional admin dashboard home
 * Data-dense layout: KPI bar, system usage chart, live feed,
 * active sessions, enrollment by course, login analytics.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import LoginAnalytics from '../LoginAnalytics';
import { SYSTEMS, fmt, timeAgo } from '../constants';
import {
  getSystemVisitStats,
  getRecentSystemVisits,
  getPortalMetrics,
  subscribeToSystemVisits,
  getActiveSessions,
  getSystemApplications,
} from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';

// ── tiny skeleton shimmer style ──────────────────────────
const SHIMMER = {
  display: 'inline-block',
  width: '48px',
  height: '18px',
  borderRadius: 4,
  background: 'linear-gradient(90deg,#e5e7eb 25%,#d1d5db 50%,#e5e7eb 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s infinite',
  verticalAlign: 'middle',
};

// ── SVG icon helpers ─────────────────────────────────────
const Icon = {
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  login: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
      <polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
    </svg>
  ),
  sessions: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  clicks: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  monitor: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  feed: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
      <path d="M4 11a9 9 0 019 9"/><path d="M4 4a16 16 0 0116 16"/>
      <circle cx="5" cy="19" r="1" fill="currentColor"/>
    </svg>
  ),
  person: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  graduation: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  ),
};

// ── duration formatter ───────────────────────────────────
const formatDuration = (loginAt) => {
  const mins = Math.round((Date.now() - new Date(loginAt).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

// ── compact table styles ─────────────────────────────────
const TH = {
  fontSize: '0.68rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#6b7280',
  padding: '6px 10px',
  borderBottom: '1px solid #e5e7eb',
  textAlign: 'left',
  whiteSpace: 'nowrap',
};
const TD = {
  fontSize: '0.8rem',
  padding: '7px 10px',
  borderBottom: '1px solid #f3f4f6',
  color: '#374151',
  verticalAlign: 'middle',
};

// ── custom recharts tooltip ──────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 6,
      padding: '8px 12px',
      fontSize: '0.8rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    }}>
      <p style={{ fontWeight: 600, color: '#111827', marginBottom: 2 }}>{label}</p>
      <p style={{ color: '#6b7280' }}>{payload[0].value} visit{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  );
};

// ════════════════════════════════════════════════════════
const OverviewPage = ({ user }) => {
  const [loading,              setLoading]              = useState(true);
  const [refreshing,           setRefreshing]           = useState(false);
  const [metrics,              setMetrics]              = useState({ totalSessions: 0, todaySessions: 0, totalClicks: 0 });
  const [visitStats,           setVisitStats]           = useState({});
  const [recentVisits,         setRecentVisits]         = useState([]);
  const [activeSessions,       setActiveSessions]       = useState([]);
  const [studentCount,         setStudentCount]         = useState(0);
  const [systemAccessesToday,  setSystemAccessesToday]  = useState(0);
  const [activeSystemsCount,   setActiveSystemsCount]   = useState(0);
  const [enrollmentByCourse,   setEnrollmentByCourse]   = useState([]);
  const [dbSystems,            setDbSystems]            = useState([]);
  const [lastUpdated,          setLastUpdated]          = useState(null);
  const [tick,                 setTick]                 = useState(0);  // forces relative-time refresh

  // ── main data fetch ──────────────────────────────────
  const fetchAll = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);

    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayISO = todayStart.toISOString();

      const [
        newMetrics,
        newVisitStats,
        newRecentVisits,
        newActiveSessions,
        newDbSystems,
        studentsRes,
        sysAccessRes,
        activeSysRes,
        enrollmentRes,
      ] = await Promise.allSettled([
        getPortalMetrics(),
        getSystemVisitStats(),
        getRecentSystemVisits(15),
        getActiveSessions(),
        getSystemApplications(false),
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('system_visits').select('*', { count: 'exact', head: true }).gte('visited_at', todayISO),
        supabase.from('system_applications').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('students').select('course'),
      ]);

      if (newMetrics.status === 'fulfilled')      setMetrics(newMetrics.value);
      if (newVisitStats.status === 'fulfilled')   setVisitStats(newVisitStats.value);
      if (newRecentVisits.status === 'fulfilled') setRecentVisits(newRecentVisits.value);
      if (newActiveSessions.status === 'fulfilled') setActiveSessions(newActiveSessions.value);
      if (newDbSystems.status === 'fulfilled')    setDbSystems(newDbSystems.value);

      if (studentsRes.status === 'fulfilled')
        setStudentCount(studentsRes.value?.count ?? 0);

      if (sysAccessRes.status === 'fulfilled')
        setSystemAccessesToday(sysAccessRes.value?.count ?? 0);

      if (activeSysRes.status === 'fulfilled')
        setActiveSystemsCount(activeSysRes.value?.count ?? 0);

      if (enrollmentRes.status === 'fulfilled') {
        const rows = enrollmentRes.value?.data || [];
        const grouped = {};
        rows.forEach(r => {
          const c = r.course?.trim() || 'Unknown';
          grouped[c] = (grouped[c] || 0) + 1;
        });
        const sorted = Object.entries(grouped)
          .map(([course, count]) => ({ course, count }))
          .sort((a, b) => b.count - a.count);
        setEnrollmentByCourse(sorted);
      }

      setLastUpdated(new Date());
    } catch (e) {
      console.error('OverviewPage fetchAll error:', e);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  // ── mount: initial fetch + 30s polling + realtime ────
  useEffect(() => {
    fetchAll();
    const poll = setInterval(() => fetchAll(), 30_000);
    const channel = subscribeToSystemVisits(() => fetchAll());
    return () => {
      clearInterval(poll);
      if (channel?.unsubscribe) channel.unsubscribe();
    };
  }, [fetchAll]);

  // ── 10s tick for relative-time labels ───────────────
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 10_000);
    return () => clearInterval(timer);
  }, []);

  // ── derived: most active system ─────────────────────
  const mostActiveEntry = (() => {
    const entries = Object.entries(visitStats);
    if (!entries.length) return null;
    const [topId, topCount] = entries.reduce((best, cur) => cur[1] > best[1] ? cur : best);
    // try DB systems first, then SYSTEMS constant
    const dbSys = dbSystems.find(s => s.id === topId);
    const constSys = SYSTEMS.find(s => s.id === topId);
    const label = dbSys?.name || constSys?.label || topId;
    return { label, count: topCount };
  })();

  // ── derived: chart data ──────────────────────────────
  const chartData = (() => {
    const source = dbSystems.length ? dbSystems : SYSTEMS.map(s => ({ id: s.id, name: s.label, color: s.color }));
    return source
      .map(s => ({
        name:   s.name || s.label || s.id,
        visits: visitStats[s.id] || 0,
        color:  s.color || '#002280',
      }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);
  })();

  const totalEnrolled = enrollmentByCourse.reduce((s, r) => s + r.count, 0);

  // ── KPI cards config ─────────────────────────────────
  const KPI = [
    {
      label: 'Total Students',
      value: studentCount,
      sub: 'enrolled',
      color: '#002280', bg: '#eef1fb',
      icon: Icon.users,
    },
    {
      label: "Today's Logins",
      value: metrics.todaySessions,
      sub: 'login sessions today',
      color: '#10813f', bg: '#edf7f1',
      icon: Icon.login,
    },
    {
      label: 'Total Sessions',
      value: metrics.totalSessions,
      sub: 'all-time portal logins',
      color: '#002280', bg: '#eef1fb',
      icon: Icon.sessions,
    },
    {
      label: 'System Accesses Today',
      value: systemAccessesToday,
      sub: 'portal clicks today',
      color: '#C8960C', bg: '#fdf8ec',
      icon: Icon.clicks,
    },
    {
      label: 'Active Systems',
      value: activeSystemsCount,
      sub: 'live portals',
      color: '#7c3aed', bg: '#f5f0ff',
      icon: Icon.monitor,
    },
    {
      label: mostActiveEntry ? mostActiveEntry.label : '—',
      value: mostActiveEntry ? mostActiveEntry.count : 0,
      sub: mostActiveEntry ? `${fmt(mostActiveEntry.count)} visits` : 'No visits yet',
      isTopSystem: true,
      color: '#C8102E', bg: '#fdf0f2',
      icon: Icon.star,
    },
  ];

  // ── last-updated label ───────────────────────────────
  const lastUpdatedLabel = lastUpdated
    ? timeAgo(lastUpdated.getTime())
    : 'Never';

  return (
    <>
      {/* shimmer keyframes */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        .ov-shimmer {
          display: inline-block;
          width: 48px; height: 18px; border-radius: 4px;
          background: linear-gradient(90deg,#e5e7eb 25%,#d1d5db 50%,#e5e7eb 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          vertical-align: middle;
        }
      `}</style>

      <div className="db-home-content">

        {/* ── Page header ───────────────────────────────── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          padding: '20px 24px 16px', borderBottom: '1px solid #e5e7eb', marginBottom: 20,
        }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
              Dashboard Overview
            </h2>
            <span style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 3, display: 'block' }}>
              {new Date().toLocaleDateString('en-PH', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: '0.74rem', color: '#6b7280' }}>
              Updated {lastUpdatedLabel}
            </span>
            <button
              onClick={() => fetchAll(true)}
              disabled={refreshing || loading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: '0.78rem', fontWeight: 500, color: '#374151',
                background: '#fff', border: '1px solid #d1d5db',
                borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
                opacity: refreshing ? 0.6 : 1, transition: 'opacity 0.2s',
              }}
            >
              <span style={{ fontSize: '1rem', lineHeight: 1, display: 'inline-block', transform: refreshing ? 'rotate(45deg)' : 'none', transition: 'transform 0.3s' }}>↻</span>
              Refresh
            </button>
          </div>
        </div>

        {/* ── KPI stat cards ─────────────────────────────── */}
        <div style={{ padding: '0 24px' }}>
          <div className="db-stats-row">
            {KPI.map((k, i) => (
              <div key={i} className="db-stat-card" style={{ '--sc': k.color, '--sc-bg': k.bg }}>
                <div className="db-stat-icon" style={{ background: k.bg, color: k.color }}>
                  {k.icon}
                </div>
                <div className="db-stat-body">
                  <p className="db-stat-value">
                    {loading
                      ? <span className="ov-shimmer" />
                      : (k.isTopSystem && !mostActiveEntry) ? '—' : fmt(k.value)
                    }
                  </p>
                  <p className="db-stat-label">{k.label}</p>
                  <p className="db-stat-sub">{k.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Two-column: chart + live feed ──────────────── */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 20,
          marginTop: 20, padding: '0 24px',
        }}>
          {/* System Usage Chart */}
          <div className="db-panel" style={{ flex: '1 1 340px', minWidth: 0 }}>
            <div className="db-panel-header">
              <div className="db-panel-header-left">
                <div className="db-panel-icon db-panel-icon--blue">{Icon.chart}</div>
                <h3 className="db-panel-title">System Usage</h3>
              </div>
              <span className="db-badge-pill">All time</span>
            </div>

            {loading ? (
              <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="ov-shimmer" style={{ width: '80%', height: 120 }} />
              </div>
            ) : chartData.every(d => d.visits === 0) ? (
              <div className="db-empty-state">
                {Icon.chart}
                <p>No activity recorded yet.</p>
                <span>System visit data will appear here.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(160, chartData.length * 36)}>
                <BarChart layout="vertical" data={chartData} margin={{ top: 4, right: 32, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Bar dataKey="visits" radius={[0, 4, 4, 0]} maxBarSize={22}>
                    {chartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Live Access Feed */}
          <div className="db-panel" style={{ flex: '1 1 340px', minWidth: 0 }}>
            <div className="db-panel-header">
              <div className="db-panel-header-left">
                <div className="db-panel-icon db-panel-icon--green">{Icon.feed}</div>
                <h3 className="db-panel-title">Live Access Feed</h3>
              </div>
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, color: '#10813f',
                background: '#edf7f1', borderRadius: 20, padding: '2px 8px',
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#10813f', display: 'inline-block',
                }} />
                Live
              </span>
            </div>

            {loading ? (
              <div style={{ padding: '12px 0' }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="db-log-row" style={{ opacity: 0.5 }}>
                    <div className="db-log-dot" style={{ background: '#e5e7eb' }} />
                    <div className="db-log-info">
                      <span className="ov-shimmer" style={{ width: 100 }} />
                    </div>
                    <span className="ov-shimmer" style={{ width: 36 }} />
                  </div>
                ))}
              </div>
            ) : recentVisits.length === 0 ? (
              <div className="db-empty-state">
                {Icon.feed}
                <p>No activity yet.</p>
                <span>Visits will appear here in real time.</span>
              </div>
            ) : (
              <div className="db-activity-log">
                {recentVisits.map((v, i) => {
                  const sys  = SYSTEMS.find(s => s.id === v.system_id);
                  const dbS  = dbSystems.find(s => s.id === v.system_id);
                  const color = dbS?.color || sys?.color || '#9ca3af';
                  const ts   = new Date(v.visited_at).getTime();
                  return (
                    <div key={v.id ?? i} className="db-log-row"
                      title={new Date(v.visited_at).toLocaleString('en-PH')}>
                      <div className="db-log-dot" style={{ background: color }} />
                      <div className="db-log-info">
                        <span className="db-log-label">{v.system_label || v.system_id}</span>
                        <span className="db-log-sub">{v.user_id || 'Anonymous'}</span>
                      </div>
                      <span className="db-log-time">{timeAgo(ts)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Two-column: active sessions + enrollment ───── */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 20,
          marginTop: 20, padding: '0 24px',
        }}>
          {/* Active Sessions */}
          <div className="db-panel" style={{ flex: '1 1 340px', minWidth: 0 }}>
            <div className="db-panel-header">
              <div className="db-panel-header-left">
                <div className="db-panel-icon db-panel-icon--green">{Icon.person}</div>
                <h3 className="db-panel-title">Active Sessions</h3>
              </div>
              <span style={{
                fontSize: '0.72rem', fontWeight: 600,
                color: activeSessions.length > 0 ? '#10813f' : '#6b7280',
                background: activeSessions.length > 0 ? '#edf7f1' : '#f3f4f6',
                borderRadius: 20, padding: '2px 8px',
              }}>
                {loading ? '—' : activeSessions.length} online
              </span>
            </div>

            {loading ? (
              <div style={{ padding: '10px 0' }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 8 }}>
                    <span className="ov-shimmer" style={{ width: '30%' }} />
                    <span className="ov-shimmer" style={{ width: '20%' }} />
                    <span className="ov-shimmer" style={{ width: '25%' }} />
                  </div>
                ))}
              </div>
            ) : activeSessions.length === 0 ? (
              <div className="db-empty-state">
                {Icon.person}
                <p>No active sessions</p>
                <span>Users who are currently logged in will appear here.</span>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={TH}>User</th>
                      <th style={TH}>Role</th>
                      <th style={TH}>Login Time</th>
                      <th style={TH}>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSessions.map((s, i) => (
                      <tr key={s.id ?? i} title={`ID: ${s.user_id}`}>
                        <td style={TD}>
                          <span style={{ fontWeight: 500, color: '#111827' }}>
                            {s.full_name || s.user_id}
                          </span>
                        </td>
                        <td style={TD}>
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 600, borderRadius: 4,
                            padding: '2px 6px',
                            background: s.role === 'Admin' ? '#eef1fb' : '#f3f4f6',
                            color: s.role === 'Admin' ? '#002280' : '#374151',
                          }}>
                            {s.role || 'User'}
                          </span>
                        </td>
                        <td style={TD}>
                          <span title={new Date(s.login_at).toLocaleString('en-PH')}>
                            {timeAgo(new Date(s.login_at).getTime())}
                          </span>
                        </td>
                        <td style={{ ...TD, fontVariantNumeric: 'tabular-nums' }}>
                          {formatDuration(s.login_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Enrollment by Course */}
          <div className="db-panel" style={{ flex: '1 1 340px', minWidth: 0 }}>
            <div className="db-panel-header">
              <div className="db-panel-header-left">
                <div className="db-panel-icon db-panel-icon--gold">{Icon.graduation}</div>
                <h3 className="db-panel-title">Enrollment by Course</h3>
              </div>
              {!loading && totalEnrolled > 0 && (
                <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                  {fmt(totalEnrolled)} total
                </span>
              )}
            </div>

            {loading ? (
              <div style={{ padding: '10px 0' }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 8 }}>
                    <span className="ov-shimmer" style={{ width: '40%' }} />
                    <span className="ov-shimmer" style={{ width: '15%' }} />
                    <span className="ov-shimmer" style={{ width: '15%' }} />
                  </div>
                ))}
              </div>
            ) : enrollmentByCourse.length === 0 ? (
              <div className="db-empty-state">
                {Icon.graduation}
                <p>No enrollment data</p>
                <span>Course distribution will appear once students are enrolled.</span>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={TH}>Course</th>
                      <th style={{ ...TH, textAlign: 'right' }}>Students</th>
                      <th style={{ ...TH, textAlign: 'right' }}>% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollmentByCourse.map((r, i) => {
                      const pct = totalEnrolled > 0
                        ? ((r.count / totalEnrolled) * 100).toFixed(1)
                        : '0.0';
                      return (
                        <tr key={i}>
                          <td style={TD}>
                            <span style={{ fontWeight: 500, color: '#111827' }}>{r.course}</span>
                          </td>
                          <td style={{ ...TD, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                            {fmt(r.count)}
                          </td>
                          <td style={{ ...TD, textAlign: 'right' }}>
                            <span style={{
                              fontSize: '0.74rem', color: '#6b7280',
                              fontVariantNumeric: 'tabular-nums',
                            }}>
                              {pct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Login analytics ────────────────────────────── */}
        <div style={{ padding: '0 24px', marginTop: 24 }}>
          <LoginAnalytics />
        </div>

      </div>
    </>
  );
};

export default OverviewPage;
