/**
 * OverviewPage — Professional institutional admin dashboard home.
 * Compact, data-dense layout for school registrars, IT admins, dept heads.
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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

/* ── tiny icon helpers ──────────────────────────────────── */
const Icon = ({ d, viewBox = '0 0 24 24', size = 16, fill = 'none', stroke = 'currentColor', sw = 2 }) => (
  <svg width={size} height={size} viewBox={viewBox} fill={fill} stroke={stroke} strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const RefreshIcon = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0114.14-3.36L23 10M1 14l5.35 4.36A9 9 0 0020.49 15" />
  </svg>
);

/* ── format duration from ms ───────────────────────────── */
const fmtDuration = (ms) => {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

/* ── skeleton shimmer cell ──────────────────────────────── */
const Shimmer = ({ w = 60, h = 20 }) => (
  <span style={{
    display: 'inline-block',
    width: w, height: h,
    borderRadius: 4,
    background: 'linear-gradient(90deg,#e5e7eb 25%,#d1d5db 50%,#e5e7eb 75%)',
    backgroundSize: '200% 100%',
    animation: 'db-shimmer 1.4s infinite',
    verticalAlign: 'middle',
  }} />
);

/* ── compact inline table styles ───────────────────────── */
const TH_STYLE = {
  fontSize: '0.68rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#6b7280',
  padding: '6px 8px',
  borderBottom: '2px solid #e5e7eb',
  textAlign: 'left',
  whiteSpace: 'nowrap',
};
const TD_STYLE = {
  fontSize: '0.81rem',
  color: '#374151',
  padding: '7px 8px',
  borderBottom: '1px solid #f3f4f6',
  verticalAlign: 'middle',
};

/* ── KPI stat cards config ──────────────────────────────── */
const CARD_ICONS = {
  students: (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  logins: (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
    </svg>
  ),
  sessions: (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  accesses: (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  systems: (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
  topSystem: (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
};

/* ═══════════════════════════════════════════════════════════
   OverviewPage
═══════════════════════════════════════════════════════════ */
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
  const [tick,                 setTick]                 = useState(0); // forces re-render for relative time

  /* ── fetchAll ─────────────────────────────────────────── */
  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayISO = todayStart.toISOString();

      const [
        mResult, vsResult, rvResult, asResult, sysResult,
        studResult, sysAccessResult, activeSysResult, courseResult,
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

      if (mResult.status === 'fulfilled') setMetrics(mResult.value);
      if (vsResult.status === 'fulfilled') setVisitStats(vsResult.value);
      if (rvResult.status === 'fulfilled') setRecentVisits(rvResult.value);
      if (asResult.status === 'fulfilled') setActiveSessions(asResult.value);
      if (sysResult.status === 'fulfilled') setDbSystems(sysResult.value);

      if (studResult.status === 'fulfilled')
        setStudentCount(studResult.value.count ?? 0);

      if (sysAccessResult.status === 'fulfilled')
        setSystemAccessesToday(sysAccessResult.value.count ?? 0);

      if (activeSysResult.status === 'fulfilled')
        setActiveSystemsCount(activeSysResult.value.count ?? 0);

      if (courseResult.status === 'fulfilled') {
        const rows = courseResult.value.data || [];
        const grouped = {};
        rows.forEach(r => {
          const c = r.course || 'Unspecified';
          grouped[c] = (grouped[c] || 0) + 1;
        });
        const sorted = Object.entries(grouped)
          .map(([course, count]) => ({ course, count }))
          .sort((a, b) => b.count - a.count);
        setEnrollmentByCourse(sorted);
      }

      setLastUpdated(new Date());
    } catch (e) {
      console.error('fetchAll error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /* ── mount + interval ─────────────────────────────────── */
  useEffect(() => {
    fetchAll();

    const dataInterval = setInterval(fetchAll, 30000);

    // tick every 10s to update relative timestamps without re-fetching
    const tickInterval = setInterval(() => setTick(t => t + 1), 10000);

    // real-time subscription
    const channel = subscribeToSystemVisits(fetchAll);

    return () => {
      clearInterval(dataInterval);
      clearInterval(tickInterval);
      if (channel?.unsubscribe) channel.unsubscribe();
    };
  }, [fetchAll]);

  /* ── derived: top system ──────────────────────────────── */
  const topSystem = useMemo(() => {
    const entries = Object.entries(visitStats);
    if (entries.length === 0) return null;
    const [topId, topCount] = entries.sort((a, b) => b[1] - a[1])[0];
    // try to get label from dbSystems first, then SYSTEMS constant
    const dbSys = dbSystems.find(s => s.id === topId);
    const constSys = SYSTEMS.find(s => s.id === topId);
    const label = dbSys?.name || constSys?.label || topId;
    return { label, count: topCount };
  }, [visitStats, dbSystems]);

  /* ── derived: bar chart data ──────────────────────────── */
  const chartData = useMemo(() => {
    const systems = dbSystems.length > 0 ? dbSystems : SYSTEMS;
    return systems
      .map(s => ({
        name: s.name || s.label,
        visits: visitStats[s.id] || 0,
        color: s.color || '#002280',
      }))
      .sort((a, b) => b.visits - a.visits);
  }, [dbSystems, visitStats]);

  /* ── KPI card definitions ─────────────────────────────── */
  const KPI_CARDS = [
    {
      key: 'students',
      label: 'Total Students',
      value: studentCount,
      sub: 'enrolled',
      color: '#002280', bg: '#eef1fb',
      icon: CARD_ICONS.students,
    },
    {
      key: 'logins',
      label: "Today's Logins",
      value: metrics.todaySessions,
      sub: 'login sessions today',
      color: '#10813f', bg: '#edf7f1',
      icon: CARD_ICONS.logins,
    },
    {
      key: 'sessions',
      label: 'Total Sessions',
      value: metrics.totalSessions,
      sub: 'all-time portal logins',
      color: '#002280', bg: '#eef1fb',
      icon: CARD_ICONS.sessions,
    },
    {
      key: 'accesses',
      label: 'System Accesses Today',
      value: systemAccessesToday,
      sub: 'portal clicks today',
      color: '#C8960C', bg: '#fdf8ec',
      icon: CARD_ICONS.accesses,
    },
    {
      key: 'systems',
      label: 'Active Systems',
      value: activeSystemsCount,
      sub: 'live portals',
      color: '#7c3aed', bg: '#f5f0ff',
      icon: CARD_ICONS.systems,
    },
    {
      key: 'topSystem',
      label: 'Most Active System',
      value: topSystem ? topSystem.label.split(' ')[0] : '—',
      sub: topSystem ? `${fmt(topSystem.count)} visits` : 'No visits yet',
      color: '#C8102E', bg: '#fdf0f2',
      icon: CARD_ICONS.topSystem,
    },
  ];

  /* ── header ───────────────────────────────────────────── */
  const todayLabel = new Date().toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const totalStudents = enrollmentByCourse.reduce((s, r) => s + r.count, 0);

  /* ── render ───────────────────────────────────────────── */
  return (
    <>
      {/* shimmer keyframe injected once */}
      <style>{`
        @keyframes db-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* ── Page Header ──────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '20px 24px 16px', borderBottom: '1px solid #e5e7eb', marginBottom: 20,
        flexWrap: 'wrap', gap: 8,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>
            Dashboard Overview
          </h2>
          <span style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2, display: 'block' }}>
            {todayLabel}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {lastUpdated && (
            <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
              Updated {timeAgo(lastUpdated.getTime())}
            </span>
          )}
          <button
            onClick={fetchAll}
            disabled={refreshing}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 11px', fontSize: '0.75rem', fontWeight: 500,
              color: refreshing ? '#9ca3af' : '#374151',
              background: '#fff', border: '1px solid #d1d5db', borderRadius: 6,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              transition: 'border-color .15s',
            }}
            title="Refresh data"
          >
            <span style={{ display: 'inline-flex', transform: refreshing ? 'rotate(180deg)' : 'none', transition: 'transform .4s' }}>
              <RefreshIcon />
            </span>
            Refresh
          </button>
        </div>
      </div>

      <div className="db-home-content">

        {/* ── KPI Stats Row ─────────────────────────────── */}
        <div className="db-stats-row">
          {KPI_CARDS.map(card => (
            <div key={card.key} className="db-stat-card"
              style={{ '--sc': card.color, '--sc-bg': card.bg }}>
              <div className="db-stat-icon" style={{ background: card.bg, color: card.color }}>
                {card.icon}
              </div>
              <div className="db-stat-body">
                <p className="db-stat-value">
                  {loading ? <Shimmer w={48} h={18} /> : fmt(typeof card.value === 'number' ? card.value : 0) || card.value}
                </p>
                <p className="db-stat-label">{card.label}</p>
                <p className="db-stat-sub">{card.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Two-column activity grid ──────────────────── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 20 }}>

          {/* Left — System Usage Chart */}
          <div className="db-panel" style={{ flex: '1 1 340px', minWidth: 0 }}>
            <div className="db-panel-header">
              <div className="db-panel-header-left">
                <div className="db-panel-icon db-panel-icon--gold">
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="18" y="3" width="4" height="18" rx="1" /><rect x="10" y="8" width="4" height="13" rx="1" /><rect x="2" y="13" width="4" height="8" rx="1" />
                  </svg>
                </div>
                <h3 className="db-panel-title">System Usage</h3>
              </div>
              <span className="db-badge-pill">All time</span>
            </div>

            {loading ? (
              <div className="db-empty-state">
                <Shimmer w={180} h={120} />
              </div>
            ) : chartData.length === 0 || chartData.every(d => d.visits === 0) ? (
              <div className="db-empty-state">
                <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth={1.5}>
                  <rect x="18" y="3" width="4" height="18" rx="1" /><rect x="10" y="8" width="4" height="13" rx="1" /><rect x="2" y="13" width="4" height="8" rx="1" />
                </svg>
                <p>No activity recorded yet</p>
                <span>System visit data will appear here once portals are accessed.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(140, chartData.length * 42)}>
                <BarChart layout="vertical" data={chartData}
                  margin={{ top: 4, right: 32, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={110}
                    tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}
                    formatter={(v) => [fmt(v), 'Visits']}
                  />
                  <Bar dataKey="visits" radius={[0, 4, 4, 0]} maxBarSize={22}>
                    {chartData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Right — Live Access Feed */}
          <div className="db-panel" style={{ flex: '1 1 340px', minWidth: 0 }}>
            <div className="db-panel-header">
              <div className="db-panel-header-left">
                <div className="db-panel-icon db-panel-icon--green">
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h3 className="db-panel-title">Live Access Feed</h3>
              </div>
              <span style={{
                fontSize: '0.7rem', fontWeight: 700, color: '#10813f',
                background: '#edf7f1', borderRadius: 20, padding: '2px 8px',
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10813f', display: 'inline-block' }} />
                Live
              </span>
            </div>

            {loading ? (
              <div className="db-activity-log">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="db-log-row">
                    <div className="db-log-dot" style={{ background: '#e5e7eb' }} />
                    <div className="db-log-info">
                      <Shimmer w={120} h={12} />
                      <Shimmer w={80} h={10} />
                    </div>
                    <Shimmer w={40} h={10} />
                  </div>
                ))}
              </div>
            ) : recentVisits.length === 0 ? (
              <div className="db-empty-state">
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth={1.5}>
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <p>No activity recorded yet</p>
                <span>Visits will appear here in real-time.</span>
              </div>
            ) : (
              <div className="db-activity-log">
                {recentVisits.map((v, i) => {
                  const sys = SYSTEMS.find(s => s.id === v.system_id)
                    || dbSystems.find(s => s.id === v.system_id);
                  const color = sys?.color || '#6b7280';
                  const visitedAt = new Date(v.visited_at);
                  return (
                    <div key={v.id ?? i} className="db-log-row"
                      title={visitedAt.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}>
                      <div className="db-log-dot" style={{ background: color }} />
                      <div className="db-log-info">
                        <span className="db-log-label">{v.system_label}</span>
                        <span className="db-log-sub">{v.user_id || 'Anonymous'}</span>
                      </div>
                      <span className="db-log-time">{timeAgo(visitedAt.getTime())}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Two-column summary grid ───────────────────── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 20 }}>

          {/* Left — Active Sessions */}
          <div className="db-panel" style={{ flex: '1 1 340px', minWidth: 0 }}>
            <div className="db-panel-header">
              <div className="db-panel-header-left">
                <div className="db-panel-icon db-panel-icon--blue">
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <h3 className="db-panel-title">Active Sessions</h3>
              </div>
              <span style={{
                fontSize: '0.7rem', fontWeight: 600,
                color: activeSessions.length > 0 ? '#10813f' : '#9ca3af',
                background: activeSessions.length > 0 ? '#edf7f1' : '#f9fafb',
                border: `1px solid ${activeSessions.length > 0 ? '#d1fae5' : '#e5e7eb'}`,
                borderRadius: 20, padding: '2px 8px',
              }}>
                {activeSessions.length} online
              </span>
            </div>

            {loading ? (
              <div style={{ padding: '12px 0' }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <Shimmer w={80} h={12} />
                    <Shimmer w={60} h={12} />
                    <Shimmer w={70} h={12} />
                    <Shimmer w={40} h={12} />
                  </div>
                ))}
              </div>
            ) : activeSessions.length === 0 ? (
              <div className="db-empty-state">
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth={1.5}>
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="23" y1="4" x2="17" y2="10" /><line x1="17" y1="4" x2="23" y2="10" />
                </svg>
                <p>No active sessions</p>
                <span>Users who are currently logged in will appear here.</span>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={TH_STYLE}>User</th>
                      <th style={TH_STYLE}>Role</th>
                      <th style={TH_STYLE}>Login</th>
                      <th style={TH_STYLE}>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSessions.map((s) => {
                      const loginAt  = new Date(s.login_at);
                      const duration = Date.now() - loginAt.getTime();
                      return (
                        <tr key={s.id}
                          title={`Login: ${loginAt.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}`}>
                          <td style={TD_STYLE}>
                            <span style={{ fontWeight: 500 }}>{s.full_name || s.user_id}</span>
                          </td>
                          <td style={TD_STYLE}>
                            <span style={{
                              fontSize: '0.68rem', fontWeight: 600,
                              color: s.role === 'Admin' ? '#7c3aed' : s.role === 'Student' ? '#002280' : '#374151',
                              background: s.role === 'Admin' ? '#f5f0ff' : s.role === 'Student' ? '#eef1fb' : '#f3f4f6',
                              borderRadius: 4, padding: '1px 6px',
                            }}>
                              {s.role}
                            </span>
                          </td>
                          <td style={{ ...TD_STYLE, color: '#6b7280', fontSize: '0.75rem' }}>
                            {loginAt.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ ...TD_STYLE, color: '#6b7280', fontSize: '0.75rem' }}>
                            {fmtDuration(duration)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right — Enrollment by Course */}
          <div className="db-panel" style={{ flex: '1 1 340px', minWidth: 0 }}>
            <div className="db-panel-header">
              <div className="db-panel-header-left">
                <div className="db-panel-icon db-panel-icon--gold">
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h3 className="db-panel-title">Enrollment by Course</h3>
              </div>
              <span style={{
                fontSize: '0.7rem', fontWeight: 600, color: '#6b7280',
                background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 20, padding: '2px 8px',
              }}>
                {fmt(totalStudents)} total
              </span>
            </div>

            {loading ? (
              <div style={{ padding: '12px 0' }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <Shimmer w={120} h={12} />
                    <Shimmer w={40} h={12} />
                    <Shimmer w={40} h={12} />
                  </div>
                ))}
              </div>
            ) : enrollmentByCourse.length === 0 ? (
              <div className="db-empty-state">
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth={1.5}>
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <p>No enrollment data available</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={TH_STYLE}>Course</th>
                      <th style={{ ...TH_STYLE, textAlign: 'right' }}>Students</th>
                      <th style={{ ...TH_STYLE, textAlign: 'right' }}>% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollmentByCourse.map((row) => {
                      const pct = totalStudents > 0
                        ? ((row.count / totalStudents) * 100).toFixed(1)
                        : '0.0';
                      return (
                        <tr key={row.course}>
                          <td style={{ ...TD_STYLE, fontWeight: 500 }}>{row.course}</td>
                          <td style={{ ...TD_STYLE, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                            {fmt(row.count)}
                          </td>
                          <td style={{ ...TD_STYLE, textAlign: 'right' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 70, justifyContent: 'flex-end' }}>
                              <span style={{
                                display: 'inline-block', height: 4, width: Math.round(parseFloat(pct) * 0.6),
                                background: '#002280', borderRadius: 2, opacity: 0.5,
                              }} />
                              <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.78rem' }}>
                                {pct}%
                              </span>
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

        {/* ── Login Analytics ───────────────────────────── */}
        <div style={{ marginTop: 24 }}>
          <LoginAnalytics />
        </div>

      </div>
    </>
  );
};

export default OverviewPage;
