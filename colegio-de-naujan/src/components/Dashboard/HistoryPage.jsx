/**
 * HistoryPage
 * ─────────────────────────────────────────────
 * Uses DashboardShell for all chrome (topbar, sidebar, chatbot).
 * Three-tab audit dashboard:
 *   1. Login History (portal_sessions)
 *   2. System Access Log (system_visits)
 *   3. Activity Log (system_logs)
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate }         from 'react-router-dom';
import { supabase }            from '../../lib/supabase';
import DashboardShell          from './DashboardShell';
import { getActivityLogs, getLogStats, exportLogsCSV } from '../../lib/activityLogger';

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */

const PAGE_SIZE = 50;

function calcDuration(login_at, logout_at) {
  if (!login_at) return '—';
  const start = new Date(login_at);
  const end   = logout_at ? new Date(logout_at) : new Date();
  const diffMs = end - start;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return mins + 'm';
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

function fmtFull(iso) {
  if (!iso) return { full: '—', rel: '' };
  const d = new Date(iso);
  const full = d.toLocaleString('en-PH', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
  let rel;
  if (diffMin < 1)    rel = 'just now';
  else if (diffMin < 60)   rel = diffMin + 'm ago';
  else if (diffMin < 1440) rel = Math.floor(diffMin / 60) + 'h ago';
  else                     rel = Math.floor(diffMin / 1440) + 'd ago';
  return { full, rel };
}

function applyDateRange(isoStr, range) {
  if (!range || range === 'all') return true;
  const d   = new Date(isoStr);
  const now = new Date();
  if (range === 'today') {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return d >= start;
  }
  if (range === 'week')  return d >= new Date(now - 7 * 24 * 60 * 60 * 1000);
  if (range === 'month') return d >= new Date(now - 30 * 24 * 60 * 60 * 1000);
  return true;
}

function dateLabel(isoStr) {
  const d         = new Date(isoStr);
  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today - 86400000);
  const day       = new Date(d); day.setHours(0, 0, 0, 0);
  if (+day === +today)     return 'Today';
  if (+day === +yesterday) return 'Yesterday';
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function exportLoginCSV(rows) {
  const headers = ['#', 'Full Name', 'Student No.', 'Course/Role', 'Login Time', 'Logout Time', 'Duration', 'Status'];
  const data = rows.map((r, i) => [
    i + 1,
    r.full_name  || '',
    r.user_id    || '',
    r.course || r.role || '',
    r.login_at  ? new Date(r.login_at).toLocaleString('en-PH')  : '',
    r.logout_at ? new Date(r.logout_at).toLocaleString('en-PH') : '',
    calcDuration(r.login_at, r.logout_at),
    !r.logout_at ? 'Online' : 'Logged Out',
  ]);
  const csv = [headers, ...data]
    .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
    download: `CDN_LoginHistory_${new Date().toISOString().slice(0, 10)}.csv`,
  });
  a.click();
}

function exportVisitsCSV(rows) {
  const headers = ['#', 'Student No.', 'System', 'Date & Time'];
  const data = rows.map((r, i) => [
    i + 1,
    r.user_id  || '',
    r.system_label || r.system_id || '',
    r.visited_at ? new Date(r.visited_at).toLocaleString('en-PH') : '',
  ]);
  const csv = [headers, ...data]
    .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
    download: `CDN_SystemVisits_${new Date().toISOString().slice(0, 10)}.csv`,
  });
  a.click();
}

/* ── shared style constants ─────────────────────────────── */
const colH = {
  fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af',
  textTransform: 'uppercase', letterSpacing: '0.05em',
};

const SYSTEM_COLORS = { csc: '#002280', osas: '#C8102E', admission: '#C8960C' };

function systemColor(system_id) {
  if (!system_id) return '#6b7280';
  const k = String(system_id).toLowerCase();
  for (const [key, val] of Object.entries(SYSTEM_COLORS)) {
    if (k.includes(key)) return val;
  }
  return '#6b7280';
}

function statusBadgeStyle(status) {
  switch ((status || '').toLowerCase()) {
    case 'success': return { background: '#edf7f1', color: '#10813f' };
    case 'failed':  return { background: '#fdf2f2', color: '#C8102E' };
    case 'warning': return { background: '#fdf8ec', color: '#C8960C' };
    case 'info':    return { background: '#eef1fb', color: '#002280' };
    default:        return { background: '#f3f4f6', color: '#6b7280' };
  }
}

function statusDotColor(status) {
  switch ((status || '').toLowerCase()) {
    case 'success': return '#10813f';
    case 'failed':  return '#C8102E';
    case 'warning': return '#C8960C';
    case 'info':    return '#002280';
    default:        return '#6b7280';
  }
}

/* skeleton row */
const SkeletonRow = ({ cols }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: cols,
    padding: '14px 18px',
    borderBottom: '1px solid #f3f4f6',
    gap: 12,
    alignItems: 'center',
  }}>
    {Array.from({ length: cols.split(' ').length }).map((_, i) => (
      <div key={i} style={{
        height: 14, borderRadius: 6, background: '#f3f4f6',
        animation: 'pulse 1.4s ease-in-out infinite',
        opacity: 0.7 + (i % 3) * 0.1,
      }} />
    ))}
  </div>
);

/* pagination controls */
const Pagination = ({ page, total, onPrev, onNext }) => {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = page * PAGE_SIZE + 1;
  const end   = Math.min((page + 1) * PAGE_SIZE, total);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 18px', borderTop: '1px solid #f3f4f6',
      fontSize: '0.78rem', color: '#6b7280',
    }}>
      <span>Showing {total === 0 ? 0 : start}–{end} of {total} records</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button
          onClick={onPrev} disabled={page === 0}
          style={{
            padding: '5px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb',
            background: page === 0 ? '#f9fafb' : '#fff', cursor: page === 0 ? 'default' : 'pointer',
            color: page === 0 ? '#d1d5db' : '#374151', fontSize: '0.78rem', fontWeight: 600,
          }}
        >← Prev</button>
        <span style={{ fontWeight: 700, color: '#374151' }}>Page {page + 1} of {pages}</span>
        <button
          onClick={onNext} disabled={(page + 1) * PAGE_SIZE >= total}
          style={{
            padding: '5px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb',
            background: (page + 1) * PAGE_SIZE >= total ? '#f9fafb' : '#fff',
            cursor: (page + 1) * PAGE_SIZE >= total ? 'default' : 'pointer',
            color: (page + 1) * PAGE_SIZE >= total ? '#d1d5db' : '#374151',
            fontSize: '0.78rem', fontWeight: 600,
          }}
        >Next →</button>
      </div>
    </div>
  );
};

/* live indicator */
const LiveDot = ({ lastUpdated }) => {
  const [label, setLabel] = useState('just now');
  useEffect(() => {
    const compute = () => {
      if (!lastUpdated) { setLabel('—'); return; }
      const sec = Math.round((Date.now() - lastUpdated) / 1000);
      if (sec < 5)        setLabel('just now');
      else if (sec < 60)  setLabel(sec + 's ago');
      else                setLabel(Math.floor(sec / 60) + 'm ago');
    };
    compute();
    const t = setInterval(compute, 5000);
    return () => clearInterval(t);
  }, [lastUpdated]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: '0.69rem', color: '#9ca3af' }}>Last updated {label}</span>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: '0.7rem', fontWeight: 700, color: '#10813f',
        background: '#edf7f1', borderRadius: 20, padding: '3px 10px',
        border: '1px solid #bbf7d0',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10813f', display: 'inline-block' }} />
        Live
      </span>
    </div>
  );
};

/* date range selector */
const DateRangeSelect = ({ value, onChange }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    style={{
      height: 38, padding: '0 10px', borderRadius: 10,
      border: '1.5px solid #e5e7eb', fontSize: '0.82rem',
      background: '#fff', color: '#374151', cursor: 'pointer',
    }}
  >
    <option value="today">Today</option>
    <option value="week">Last 7 days</option>
    <option value="month">Last 30 days</option>
    <option value="all">All time</option>
  </select>
);

/* ═══════════════════════════════════════════════════════════
   DATA FETCHERS
═══════════════════════════════════════════════════════════ */

async function fetchLoginHistory() {
  const { data, error } = await supabase
    .from('portal_sessions')
    .select('id, user_id, full_name, role, course, login_at, logout_at')
    .order('login_at', { ascending: false })
    .limit(500);
  if (error) { console.error('fetchLoginHistory:', error); return []; }
  return data || [];
}

async function fetchVisitHistory() {
  const { data, error } = await supabase
    .from('system_visits')
    .select('id, system_id, system_label, user_id, visited_at')
    .order('visited_at', { ascending: false })
    .limit(500);
  if (error) { console.error('fetchVisitHistory:', error); return []; }
  return data || [];
}

/* ═══════════════════════════════════════════════════════════
   HISTORY CONTENT
═══════════════════════════════════════════════════════════ */

const HistoryContent = () => {
  /* ── state ────────────────────────────────────────────── */
  const [activeTab,    setActiveTab]    = useState('logins');
  const [loginHistory, setLoginHistory] = useState([]);
  const [visitHistory, setVisitHistory] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [logStats,     setLogStats]     = useState({ total: 0, todayCount: 0, failedCount: 0 });
  const [loading,      setLoading]      = useState(true);
  const [lastUpdated,  setLastUpdated]  = useState(null);

  /* ── filter state: tab 1 ──────────────────────────────── */
  const [loginSearch,   setLoginSearch]   = useState('');
  const [courseFilter,  setCourseFilter]  = useState('all');
  const [loginStatus,   setLoginStatus]   = useState('all');
  const [loginDateRange, setLoginDateRange] = useState('all');
  const [loginPage,     setLoginPage]     = useState(0);

  /* ── filter state: tab 2 ──────────────────────────────── */
  const [visitSearch,    setVisitSearch]    = useState('');
  const [visitSystem,    setVisitSystem]    = useState('all');
  const [visitDateRange, setVisitDateRange] = useState('all');
  const [visitPage,      setVisitPage]      = useState(0);

  /* ── filter state: tab 3 ──────────────────────────────── */
  const [actSearch,     setActSearch]     = useState('');
  const [actModule,     setActModule]     = useState('all');
  const [actStatus,     setActStatus]     = useState('all');
  const [actDateRange,  setActDateRange]  = useState('all');
  const [actPage,       setActPage]       = useState(0);

  /* ── load all data ────────────────────────────────────── */
  const loadAll = useCallback(async () => {
    const [logins, visits, logs, stats] = await Promise.all([
      fetchLoginHistory(),
      fetchVisitHistory(),
      getActivityLogs({ limit: 500 }),
      getLogStats(),
    ]);
    setLoginHistory(logins);
    setVisitHistory(visits);
    setActivityLogs(logs);
    setLogStats(stats);
    setLoading(false);
    setLastUpdated(Date.now());
  }, []);

  useEffect(() => {
    loadAll();

    /* Supabase realtime */
    const ch1 = supabase.channel('hist_sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portal_sessions' }, loadAll)
      .subscribe();
    const ch2 = supabase.channel('hist_visits')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_visits' }, loadAll)
      .subscribe();
    const ch3 = supabase.channel('hist_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_logs' }, loadAll)
      .subscribe();

    /* 30-second poll */
    const poll = setInterval(loadAll, 30000);

    return () => {
      ch1.unsubscribe(); ch2.unsubscribe(); ch3.unsubscribe();
      clearInterval(poll);
    };
  }, [loadAll]);

  /* reset pages on filter changes */
  useEffect(() => { setLoginPage(0); }, [loginSearch, courseFilter, loginStatus, loginDateRange]);
  useEffect(() => { setVisitPage(0); }, [visitSearch, visitSystem, visitDateRange]);
  useEffect(() => { setActPage(0);   }, [actSearch, actModule, actStatus, actDateRange]);
  useEffect(() => {
    setLoginPage(0); setVisitPage(0); setActPage(0);
  }, [activeTab]);

  /* ── KPI stats ────────────────────────────────────────── */
  const todayStart    = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const todaySessions = useMemo(() => loginHistory.filter(r => new Date(r.login_at) >= todayStart).length, [loginHistory, todayStart]);
  const onlineSessions = useMemo(() => loginHistory.filter(r => !r.logout_at).length, [loginHistory]);
  const todayVisits   = useMemo(() => visitHistory.filter(r => new Date(r.visited_at) >= todayStart).length, [visitHistory, todayStart]);

  /* ── unique system labels (for visit filter) ──────────── */
  const uniqueSystems = useMemo(() => {
    const s = new Set(visitHistory.map(r => r.system_label || r.system_id).filter(Boolean));
    return ['all', ...Array.from(s)];
  }, [visitHistory]);

  /* ── unique modules (for activity log filter) ─────────── */
  const uniqueModules = useMemo(() => {
    const s = new Set(activityLogs.map(r => r.module).filter(Boolean));
    return ['all', ...Array.from(s)];
  }, [activityLogs]);

  /* ── filtered + paginated slices ─────────────────────── */
  const filteredLogins = useMemo(() => {
    const q = loginSearch.toLowerCase().trim();
    return loginHistory.filter(row => {
      const matchSearch = !q || [row.full_name, row.user_id, row.course, row.role]
        .some(s => (s || '').toLowerCase().includes(q));
      const matchCourse = courseFilter === 'all' || (row.course || '').toUpperCase().includes(courseFilter);
      const matchStatus = loginStatus === 'all'
        || (loginStatus === 'online' && !row.logout_at)
        || (loginStatus === 'loggedout' && !!row.logout_at);
      const matchDate   = applyDateRange(row.login_at, loginDateRange);
      return matchSearch && matchCourse && matchStatus && matchDate;
    });
  }, [loginHistory, loginSearch, courseFilter, loginStatus, loginDateRange]);

  const pagedLogins = useMemo(
    () => filteredLogins.slice(loginPage * PAGE_SIZE, (loginPage + 1) * PAGE_SIZE),
    [filteredLogins, loginPage]
  );

  const filteredVisits = useMemo(() => {
    const q = visitSearch.toLowerCase().trim();
    return visitHistory.filter(row => {
      const matchSearch = !q || [row.user_id, row.system_label, row.system_id]
        .some(s => (s || '').toLowerCase().includes(q));
      const matchSystem = visitSystem === 'all'
        || (row.system_label || row.system_id) === visitSystem;
      const matchDate   = applyDateRange(row.visited_at, visitDateRange);
      return matchSearch && matchSystem && matchDate;
    });
  }, [visitHistory, visitSearch, visitSystem, visitDateRange]);

  const pagedVisits = useMemo(
    () => filteredVisits.slice(visitPage * PAGE_SIZE, (visitPage + 1) * PAGE_SIZE),
    [filteredVisits, visitPage]
  );

  const filteredAct = useMemo(() => {
    const q = actSearch.toLowerCase().trim();
    return activityLogs.filter(row => {
      const matchSearch = !q || [row.user_id, row.user_name, row.action, row.details, row.module]
        .some(s => (s || '').toLowerCase().includes(q));
      const matchModule = actModule === 'all' || row.module === actModule;
      const matchStatus = actStatus === 'all'
        || (row.status || '').toLowerCase() === actStatus;
      const matchDate   = applyDateRange(row.created_at, actDateRange);
      return matchSearch && matchModule && matchStatus && matchDate;
    });
  }, [activityLogs, actSearch, actModule, actStatus, actDateRange]);

  const pagedAct = useMemo(
    () => filteredAct.slice(actPage * PAGE_SIZE, (actPage + 1) * PAGE_SIZE),
    [filteredAct, actPage]
  );

  /* ── tab definitions ──────────────────────────────────── */
  const TABS = [
    {
      key: 'logins', label: 'Login History', count: loginHistory.length,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    },
    {
      key: 'visits', label: 'System Access Log', count: visitHistory.length,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    },
    {
      key: 'activity', label: 'Activity Log', count: logStats.total,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    },
  ];

  /* ── render ───────────────────────────────────────────── */
  return (
    <>
      {/* ── Stats bar ─────────────────────────────────────── */}
      <div className="db-stats-row" style={{ marginBottom: 20 }}>

        {/* KPI 1: Total Login Sessions */}
        <div className="db-stat-card" style={{ '--sc': '#002280', '--sc-bg': '#eef1fb' }}>
          <div className="db-stat-icon" style={{ background: '#eef1fb', color: '#002280' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div className="db-stat-body">
            <p className="db-stat-value">{loading ? '…' : loginHistory.length}</p>
            <p className="db-stat-label">Total Login Sessions</p>
            <p className="db-stat-sub">{loading ? '…' : `${todaySessions} today`}</p>
          </div>
        </div>

        {/* KPI 2: Currently Online */}
        <div className="db-stat-card" style={{ '--sc': '#10813f', '--sc-bg': '#edf7f1' }}>
          <div className="db-stat-icon" style={{ background: '#edf7f1', color: '#10813f' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M2 12h3M19 12h3M12 2v3M12 19v3"/>
            </svg>
          </div>
          <div className="db-stat-body">
            <p className="db-stat-value">{loading ? '…' : onlineSessions}</p>
            <p className="db-stat-label">Currently Online</p>
            <p className="db-stat-sub">active sessions</p>
          </div>
        </div>

        {/* KPI 3: System Accesses Today */}
        <div className="db-stat-card" style={{ '--sc': '#C8960C', '--sc-bg': '#fdf8ec' }}>
          <div className="db-stat-icon" style={{ background: '#fdf8ec', color: '#C8960C' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div className="db-stat-body">
            <p className="db-stat-value">{loading ? '…' : todayVisits}</p>
            <p className="db-stat-label">System Accesses Today</p>
            <p className="db-stat-sub">{loading ? '…' : `${visitHistory.length} all time`}</p>
          </div>
        </div>

        {/* KPI 4: Activity Log Entries */}
        <div className="db-stat-card" style={{ '--sc': '#7c3aed', '--sc-bg': '#f5f0ff' }}>
          <div className="db-stat-icon" style={{ background: '#f5f0ff', color: '#7c3aed' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div className="db-stat-body">
            <p className="db-stat-value">{loading ? '…' : logStats.total}</p>
            <p className="db-stat-label">Activity Log Entries</p>
            <p className="db-stat-sub">{loading ? '…' : `${logStats.todayCount} today`}</p>
          </div>
        </div>

      </div>

      {/* ── Panel header ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F1422' }}>Audit History</h2>
        <LiveDot lastUpdated={lastUpdated} />
      </div>

      {/* ── Tab switcher ──────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: '#f4f6fb', borderRadius: 14, padding: 4 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '10px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '0.80rem', transition: 'all 0.15s',
            background: activeTab === t.key ? '#fff'    : 'transparent',
            color:      activeTab === t.key ? '#002280' : '#6b7280',
            boxShadow:  activeTab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}>
            {t.icon}
            {t.label}
            <span style={{
              background:   activeTab === t.key ? '#eef1fb' : '#e5e7eb',
              color:        activeTab === t.key ? '#002280' : '#9ca3af',
              borderRadius: 20, padding: '1px 7px', fontSize: '0.69rem', fontWeight: 800,
            }}>
              {loading ? '…' : t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB 1 — LOGIN HISTORY
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'logins' && (
        <div className="db-panel" style={{ padding: 0, overflow: 'hidden' }}>

          {/* panel header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: '#0F1422' }}>Login History</p>
                <p style={{ margin: 0, fontSize: '0.73rem', color: '#9ca3af', marginTop: 2 }}>portal_sessions — login audit trail</p>
              </div>
              <button
                onClick={() => exportLoginCSV(filteredLogins)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb',
                  background: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, color: '#374151',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export CSV
              </button>
            </div>

            {/* filters row */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* search */}
              <div style={{ flex: 1, minWidth: 160, position: 'relative' }}>
                <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text" placeholder="Search name, ID, course…"
                  value={loginSearch} onChange={e => setLoginSearch(e.target.value)}
                  style={{ width: '100%', paddingLeft: 32, paddingRight: 10, height: 36, borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: '0.80rem', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              {/* course pills */}
              {['all','BSIS','BPA','WFT','CHS'].map(c => (
                <button key={c} onClick={() => setCourseFilter(c)} style={{
                  padding: '5px 11px', borderRadius: 20, border: '1.5px solid',
                  borderColor: courseFilter === c ? '#002280' : '#e5e7eb',
                  background:  courseFilter === c ? '#002280' : '#fff',
                  color:       courseFilter === c ? '#fff' : '#6b7280',
                  fontSize: '0.73rem', fontWeight: 700, cursor: 'pointer',
                }}>
                  {c === 'all' ? 'All' : c}
                </button>
              ))}

              {/* status */}
              <select value={loginStatus} onChange={e => setLoginStatus(e.target.value)}
                style={{ height: 36, padding: '0 10px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: '0.80rem', background: '#fff', color: '#374151', cursor: 'pointer' }}>
                <option value="all">All Status</option>
                <option value="online">Online</option>
                <option value="loggedout">Logged Out</option>
              </select>

              {/* date range */}
              <DateRangeSelect value={loginDateRange} onChange={setLoginDateRange} />
            </div>
          </div>

          {/* table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '36px 2.2fr 1.2fr 1.4fr 1.1fr 0.9fr 1fr', padding: '8px 18px', background: '#f9fafb', borderBottom: '1px solid #f3f4f6', ...colH, gap: 8 }}>
            <span>#</span><span>User</span><span>Course / Role</span><span>Login Time</span><span>Logout Time</span><span>Duration</span><span>Status</span>
          </div>

          {/* rows */}
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <SkeletonRow key={i} cols="36px 2.2fr 1.2fr 1.4fr 1.1fr 0.9fr 1fr" />
            ))
          ) : filteredLogins.length === 0 ? (
            <div className="db-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <p>No login records found.</p>
              <span>{loginSearch ? 'Try a different search.' : 'Records appear when students log in.'}</span>
            </div>
          ) : (
            pagedLogins.map((row, idx) => {
              const online   = !row.logout_at;
              const expired  = !row.logout_at && row.login_at && (Date.now() - new Date(row.login_at)) > 8 * 3600000;
              const rowNum   = loginPage * PAGE_SIZE + idx + 1;
              const duration = calcDuration(row.login_at, row.logout_at);
              return (
                <div key={row.id} style={{
                  display: 'grid', gridTemplateColumns: '36px 2.2fr 1.2fr 1.4fr 1.1fr 0.9fr 1fr',
                  padding: '11px 18px', borderBottom: '1px solid #f9fafb', alignItems: 'center',
                  background: online && !expired ? '#f9fff9' : '#fff', gap: 8,
                }}>
                  <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700 }}>{rowNum}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.83rem', color: '#0F1422' }}>{row.full_name || row.user_id || '—'}</span>
                    <span style={{ fontSize: '0.69rem', color: '#9ca3af', letterSpacing: '0.02em' }}>{row.user_id}</span>
                  </div>
                  <div>
                    {row.course
                      ? <span style={{ background: '#eef1fb', color: '#002280', borderRadius: 20, padding: '3px 9px', fontSize: '0.70rem', fontWeight: 700 }}>{row.course}</span>
                      : <span style={{ fontSize: '0.70rem', color: '#9ca3af' }}>{row.role || 'Staff'}</span>
                    }
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: '0.76rem', color: '#374151' }}>
                      {row.login_at ? new Date(row.login_at).toLocaleString('en-PH', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>{fmtFull(row.login_at).rel}</span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#6b7280' }}>
                    {row.logout_at
                      ? new Date(row.logout_at).toLocaleString('en-PH', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                      : <span style={{ color: '#9ca3af' }}>—</span>
                    }
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#374151' }}>
                    {online && !expired ? <span style={{ color: '#10813f', fontWeight: 700 }}>Active</span> : duration}
                  </div>
                  <div>
                    {online && !expired && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#edf7f1', color: '#10813f', borderRadius: 20, padding: '3px 8px', fontSize: '0.68rem', fontWeight: 700 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10813f' }} />Online
                      </span>
                    )}
                    {online && expired && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fdf8ec', color: '#C8960C', borderRadius: 20, padding: '3px 8px', fontSize: '0.68rem', fontWeight: 700 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C8960C' }} />Expired
                      </span>
                    )}
                    {!online && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f3f4f6', color: '#9ca3af', borderRadius: 20, padding: '3px 8px', fontSize: '0.68rem', fontWeight: 700 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#9ca3af' }} />Logged Out
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* pagination */}
          {!loading && filteredLogins.length > 0 && (
            <Pagination
              page={loginPage}
              total={filteredLogins.length}
              onPrev={() => setLoginPage(p => Math.max(0, p - 1))}
              onNext={() => setLoginPage(p => p + 1)}
            />
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 2 — SYSTEM ACCESS LOG
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'visits' && (
        <div className="db-panel" style={{ padding: 0, overflow: 'hidden' }}>

          {/* panel header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: '#0F1422' }}>System Access Log</p>
                <p style={{ margin: 0, fontSize: '0.73rem', color: '#9ca3af', marginTop: 2 }}>system_visits — who accessed what and when</p>
              </div>
              <button
                onClick={() => exportVisitsCSV(filteredVisits)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb',
                  background: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, color: '#374151',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export CSV
              </button>
            </div>

            {/* filters */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 160, position: 'relative' }}>
                <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text" placeholder="Search student no. or system…"
                  value={visitSearch} onChange={e => setVisitSearch(e.target.value)}
                  style={{ width: '100%', paddingLeft: 32, paddingRight: 10, height: 36, borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: '0.80rem', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                />
              </div>
              <select value={visitSystem} onChange={e => setVisitSystem(e.target.value)}
                style={{ height: 36, padding: '0 10px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: '0.80rem', background: '#fff', color: '#374151', cursor: 'pointer' }}>
                {uniqueSystems.map(s => (
                  <option key={s} value={s}>{s === 'all' ? 'All Systems' : s}</option>
                ))}
              </select>
              <DateRangeSelect value={visitDateRange} onChange={setVisitDateRange} />
            </div>
          </div>

          {/* table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '36px 1.4fr 2fr 1.4fr', padding: '8px 18px', background: '#f9fafb', borderBottom: '1px solid #f3f4f6', ...colH, gap: 8 }}>
            <span>#</span><span>Student No.</span><span>System</span><span>Date &amp; Time</span>
          </div>

          {/* rows with date separators */}
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <SkeletonRow key={i} cols="36px 1.4fr 2fr 1.4fr" />
            ))
          ) : filteredVisits.length === 0 ? (
            <div className="db-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              <p>No system visits found.</p>
              <span>{visitSearch ? 'Try a different search.' : 'Visits appear when students open a service.'}</span>
            </div>
          ) : (() => {
            /* group paged visits by date */
            let lastDate = null;
            return pagedVisits.map((row, idx) => {
              const thisDate = dateLabel(row.visited_at);
              const showSep  = thisDate !== lastDate;
              lastDate       = thisDate;
              const rowNum   = visitPage * PAGE_SIZE + idx + 1;
              const color    = systemColor(row.system_id);
              const bgColor  = color + '18';
              const ft       = fmtFull(row.visited_at);
              return (
                <div key={row.id}>
                  {showSep && (
                    <div style={{
                      padding: '6px 18px', fontSize: '0.70rem', fontWeight: 800,
                      color: '#9ca3af', background: '#f9fafb', borderBottom: '1px solid #f3f4f6',
                      letterSpacing: '0.04em', textTransform: 'uppercase',
                    }}>
                      {thisDate}
                    </div>
                  )}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '36px 1.4fr 2fr 1.4fr',
                    padding: '11px 18px', borderBottom: '1px solid #f9fafb', alignItems: 'center', gap: 8, background: '#fff',
                  }}>
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700 }}>{rowNum}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0F1422' }}>{row.user_id || 'Anonymous'}</span>
                    <div>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: bgColor, color, borderRadius: 20, padding: '3px 11px',
                        fontSize: '0.73rem', fontWeight: 700,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                        {row.system_label || row.system_id || '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: '0.76rem', color: '#374151' }}>{ft.full}</span>
                      <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>{ft.rel}</span>
                    </div>
                  </div>
                </div>
              );
            });
          })()}

          {/* pagination */}
          {!loading && filteredVisits.length > 0 && (
            <Pagination
              page={visitPage}
              total={filteredVisits.length}
              onPrev={() => setVisitPage(p => Math.max(0, p - 1))}
              onNext={() => setVisitPage(p => p + 1)}
            />
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 3 — ACTIVITY LOG
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'activity' && (
        <div className="db-panel" style={{ padding: 0, overflow: 'hidden' }}>

          {/* panel header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: '#0F1422' }}>Activity Log</p>
                <p style={{ margin: 0, fontSize: '0.73rem', color: '#9ca3af', marginTop: 2 }}>system_logs — admin actions, errors, security events</p>
              </div>
              <button
                onClick={() => exportLogsCSV(filteredAct)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb',
                  background: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, color: '#374151',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export CSV
              </button>
            </div>

            {/* filters */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 160, position: 'relative' }}>
                <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text" placeholder="Search user, action, details…"
                  value={actSearch} onChange={e => setActSearch(e.target.value)}
                  style={{ width: '100%', paddingLeft: 32, paddingRight: 10, height: 36, borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: '0.80rem', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                />
              </div>
              <select value={actModule} onChange={e => setActModule(e.target.value)}
                style={{ height: 36, padding: '0 10px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: '0.80rem', background: '#fff', color: '#374151', cursor: 'pointer' }}>
                {uniqueModules.map(m => (
                  <option key={m} value={m}>{m === 'all' ? 'All Modules' : m}</option>
                ))}
              </select>
              <select value={actStatus} onChange={e => setActStatus(e.target.value)}
                style={{ height: 36, padding: '0 10px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: '0.80rem', background: '#fff', color: '#374151', cursor: 'pointer' }}>
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="warning">Warning</option>
              </select>
              <DateRangeSelect value={actDateRange} onChange={setActDateRange} />
            </div>
          </div>

          {/* table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '36px 1.5fr 1.2fr 1fr 1.5fr 2fr 0.9fr', padding: '8px 18px', background: '#f9fafb', borderBottom: '1px solid #f3f4f6', ...colH, gap: 8 }}>
            <span>#</span><span>Timestamp</span><span>User</span><span>Module</span><span>Action</span><span>Details</span><span>Status</span>
          </div>

          {/* rows */}
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <SkeletonRow key={i} cols="36px 1.5fr 1.2fr 1fr 1.5fr 2fr 0.9fr" />
            ))
          ) : filteredAct.length === 0 ? (
            <div className="db-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
              </svg>
              <p>No activity logs found.</p>
              <span>{actSearch ? 'Try a different search.' : 'Admin actions will appear here.'}</span>
            </div>
          ) : (
            pagedAct.map((row, idx) => {
              const ft       = fmtFull(row.created_at);
              const isFailed = (row.status || '').toLowerCase() === 'failed';
              const badge    = statusBadgeStyle(row.status);
              const dot      = statusDotColor(row.status);
              const rowNum   = actPage * PAGE_SIZE + idx + 1;
              return (
                <div key={row.id} style={{
                  display: 'grid', gridTemplateColumns: '36px 1.5fr 1.2fr 1fr 1.5fr 2fr 0.9fr',
                  padding: '11px 18px', borderBottom: '1px solid #f9fafb', alignItems: 'center',
                  background: '#fff', gap: 8,
                  borderLeft: isFailed ? '3px solid #C8102E' : '3px solid transparent',
                }}>
                  <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700 }}>{rowNum}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: '0.76rem', color: '#374151' }}>{ft.full}</span>
                    <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>{ft.rel}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.80rem', color: '#0F1422' }}>{row.user_name || row.user_id || '—'}</span>
                    {row.user_name && row.user_id && row.user_name !== row.user_id && (
                      <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>{row.user_id}</span>
                    )}
                  </div>
                  <div>
                    {row.module && (
                      <span style={{ background: '#f3f4f6', color: '#6b7280', borderRadius: 6, padding: '2px 8px', fontSize: '0.70rem', fontWeight: 700 }}>{row.module}</span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#374151', fontWeight: 600 }}>{row.action || '—'}</span>
                  <span style={{ fontSize: '0.74rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    title={row.details}>
                    {row.details || '—'}
                  </span>
                  <div>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      borderRadius: 20, padding: '3px 8px', fontSize: '0.68rem', fontWeight: 700,
                      ...badge,
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: dot }} />
                      {(row.status || 'info').charAt(0).toUpperCase() + (row.status || 'info').slice(1)}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {/* pagination */}
          {!loading && filteredAct.length > 0 && (
            <Pagination
              page={actPage}
              total={filteredAct.length}
              onPrev={() => setActPage(p => Math.max(0, p - 1))}
              onNext={() => setActPage(p => p + 1)}
            />
          )}
        </div>
      )}
    </>
  );
};

/* ══════════════════════════════════════════════════════════
   HistoryPage — wraps content in DashboardShell
══════════════════════════════════════════════════════════ */
const HistoryPage = ({ user }) => {
  const navigate = useNavigate();

  return (
    <DashboardShell
      user={user}
      onLogout={() => navigate('/')}
      activeTab="history"
      onTabChange={(tab) => navigate('/dashboard' + (tab !== 'overview' ? '?tab=' + tab : ''))}
      onRoute={(path) => navigate(path)}
    >
      <div className="db-home-content">
        <HistoryContent />
      </div>
    </DashboardShell>
  );
};

export default HistoryPage;
