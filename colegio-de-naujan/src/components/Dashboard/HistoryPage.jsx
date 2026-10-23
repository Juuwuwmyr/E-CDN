/**
 * HistoryPage
 * ─────────────────────────────────────────────
 * Uses DashboardShell for all chrome (topbar, sidebar, chatbot).
 * This file owns only the data-fetching and table UI.
 */
import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { supabase }            from '../../lib/supabase';
import DashboardShell          from './DashboardShell';
import { NAV_ITEMS }           from './constants';

/* ── helpers ─────────────────────────────────────────────── */
const SYSTEM_META = {
  csc:       { label: 'CSC Services',       color: '#002280', bg: '#eef1fb' },
  osas:      { label: 'OSAS Services',      color: '#C8102E', bg: '#fdf0f2' },
  admission: { label: 'Admission Services', color: '#C8960C', bg: '#fdf8ec' },
};

const DEPT_COLORS = {
  BSIS: '#002280', BPA: '#C8102E',
  'BTVTED-WFT': '#C8960C', 'BTVTED-CHS': '#7c3aed',
};

const deptColor = (course) => {
  if (!course) return '#6b7280';
  const u = course.toUpperCase();
  if (u.includes('BSIS')) return DEPT_COLORS['BSIS'];
  if (u.includes('WFT'))  return DEPT_COLORS['BTVTED-WFT'];
  if (u.includes('CHS'))  return DEPT_COLORS['BTVTED-CHS'];
  if (u.includes('BPA'))  return DEPT_COLORS['BPA'];
  return '#6b7280';
};

const fmtTime = (iso) => {
  if (!iso) return '—';
  const d       = new Date(iso);
  const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
  const timeStr = d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  const dateStr = d.toLocaleDateString('en-PH', { month: 'short', day: '2-digit', year: 'numeric' });
  if (diffMin < 1)    return 'just now';
  if (diffMin < 60)   return diffMin + 'm ago · ' + timeStr;
  if (diffMin < 1440) return Math.floor(diffMin / 60) + 'h ago · ' + timeStr;
  return dateStr + ' ' + timeStr;
};

const LiveDot = () => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: '0.7rem', fontWeight: 700, color: '#10813f',
    background: '#edf7f1', borderRadius: 20, padding: '3px 10px',
    border: '1px solid #bbf7d0',
  }}>
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10813f', display: 'inline-block' }} />
    Live
  </span>
);

const colH = {
  fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af',
  textTransform: 'uppercase', letterSpacing: '0.05em',
};

/* ── data fetchers ───────────────────────────────────────── */
async function fetchLoginHistory() {
  const { data, error } = await supabase
    .from('portal_sessions')
    .select('id, user_id, full_name, role, course, login_at, logout_at')
    .order('login_at', { ascending: false })
    .limit(200);
  if (error) { console.error('fetchLoginHistory:', error); return []; }
  return data || [];
}

async function fetchVisitHistory() {
  const { data, error } = await supabase
    .from('system_visits')
    .select('id, system_id, system_label, user_id, visited_at')
    .order('visited_at', { ascending: false })
    .limit(200);
  if (error) { console.error('fetchVisitHistory:', error); return []; }
  return data || [];
}

/* ── HistoryContent (the actual page body) ───────────────── */
const HistoryContent = () => {
  const [subTab,       setSubTab]       = useState('logins');
  const [loginHistory, setLoginHistory] = useState([]);
  const [visitHistory, setVisitHistory] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [courseFilter, setCourseFilter] = useState('all');

  /* ── derived stat values (computed from already-fetched data) ── */
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todaySessions  = loginHistory.filter(r => new Date(r.login_at) >= todayStart).length;
  const onlineSessions = loginHistory.filter(r => !r.logout_at).length;
  const todayVisits    = visitHistory.filter(r => new Date(r.visited_at) >= todayStart).length;

  /* most-visited system from visit history */
  const visitCounts = visitHistory.reduce((acc, r) => {
    acc[r.system_label] = (acc[r.system_label] || 0) + 1;
    return acc;
  }, {});
  const topVisit = Object.entries(visitCounts).sort((a,b) => b[1]-a[1])[0];

  const STAT_CARDS = [
    {
      label: 'Total Login Records',
      value: loading ? '…' : loginHistory.length,
      sub:   loading ? '…' : `${todaySessions} today`,
      color: '#002280', bg: '#eef1fb',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
    {
      label: 'Currently Online',
      value: loading ? '…' : onlineSessions,
      sub:   'active sessions',
      color: '#10813f', bg: '#edf7f1',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M2 12h3M19 12h3M12 2v3M12 19v3"/>
        </svg>
      ),
    },
    {
      label: 'System Visit Records',
      value: loading ? '…' : visitHistory.length,
      sub:   loading ? '…' : `${todayVisits} today`,
      color: '#C8960C', bg: '#fdf8ec',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
    },
    {
      label: 'Top Visited System',
      value: loading ? '…' : (topVisit?.[0]?.split(' ')[0] ?? 'None'),
      sub:   loading ? '…' : (topVisit ? `${topVisit[1]} visits` : 'No activity yet'),
      color: '#7c3aed', bg: '#f5f0ff',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
          <polyline points="17 6 23 6 23 12"/>
        </svg>
      ),
    },
  ];

  const loadAll = async () => {
    const [logins, visits] = await Promise.all([fetchLoginHistory(), fetchVisitHistory()]);
    setLoginHistory(logins);
    setVisitHistory(visits);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    const ch1 = supabase.channel('hist_sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portal_sessions' }, loadAll)
      .subscribe();
    const ch2 = supabase.channel('hist_visits')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_visits' }, loadAll)
      .subscribe();
    const poll = setInterval(loadAll, 5000);
    return () => { ch1.unsubscribe(); ch2.unsubscribe(); clearInterval(poll); };
  }, []);

  const q       = search.toLowerCase().trim();
  const COURSES = ['all', 'BSIS', 'BPA', 'WFT', 'CHS'];

  const filteredLogins = loginHistory.filter(row => {
    const matchSearch = !q || [row.full_name, row.user_id, row.course, row.role]
      .some(s => (s || '').toLowerCase().includes(q));
    const matchCourse = courseFilter === 'all' || (row.course || '').toUpperCase().includes(courseFilter);
    return matchSearch && matchCourse;
  });

  const filteredVisits = visitHistory.filter(row =>
    !q || [row.user_id, row.system_label].some(s => (s || '').toLowerCase().includes(q))
  );

  /* sub-tab definitions */
  const SUB_TABS = [
    {
      key: 'logins', label: 'Login History', count: loginHistory.length,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    },
    {
      key: 'visits', label: 'System Visits', count: visitHistory.length,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    },
  ];

  return (
    <>
      {/* Stat cards */}
      <div className="db-stats-row" style={{ marginBottom: 20 }}>
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

      {/* page heading */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F1422' }}>History</h2>
        <LiveDot />
      </div>

      {/* sub-tab switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, background: '#f4f6fb', borderRadius: 14, padding: 4 }}>
        {SUB_TABS.map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '0.82rem', transition: 'all 0.15s',
            background: subTab === t.key ? '#fff'        : 'transparent',
            color:      subTab === t.key ? '#002280'     : '#6b7280',
            boxShadow:  subTab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}>
            {t.icon}
            {t.label}
            <span style={{
              background:  subTab === t.key ? '#eef1fb' : '#e5e7eb',
              color:       subTab === t.key ? '#002280' : '#9ca3af',
              borderRadius: 20, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 800,
            }}>
              {loading ? '...' : t.count}
            </span>
          </button>
        ))}
      </div>

      {/* search + course filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder={subTab === 'logins' ? 'Search name, student no., course…' : 'Search student no. or service…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: 32, paddingRight: 12, height: 38,
              borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: '0.82rem',
              outline: 'none', background: '#fff', boxSizing: 'border-box',
            }}
          />
        </div>
        {subTab === 'logins' && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {COURSES.map(c => (
              <button key={c} onClick={() => setCourseFilter(c)} style={{
                padding: '6px 12px', borderRadius: 20, border: '1.5px solid',
                borderColor: courseFilter === c ? (c === 'all' ? '#0F1422' : deptColor(c)) : '#e5e7eb',
                background:  courseFilter === c ? (c === 'all' ? '#0F1422' : deptColor(c)) : '#fff',
                color:       courseFilter === c ? '#fff' : '#6b7280',
                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
              }}>
                {c === 'all' ? 'All' : c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── LOGIN HISTORY ── */}
      {subTab === 'logins' && (
        <div className="db-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: '#0F1422' }}>Login History</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
                {loading ? 'Loading...' : `${filteredLogins.length} record${filteredLogins.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <LiveDot />
          </div>

          {loading ? (
            <div className="db-empty-state"><p>Loading…</p></div>
          ) : filteredLogins.length === 0 ? (
            <div className="db-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <p>No login records found.</p>
              <span>{search ? 'Try a different search.' : 'Records appear when students log in.'}</span>
            </div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.3fr 1.5fr 1fr', padding: '8px 18px', background: '#f9fafb', borderBottom: '1px solid #f3f4f6', ...colH }}>
                <span>Student</span><span>Course</span><span>Login Time</span><span>Status</span>
              </div>
              {filteredLogins.map(row => {
                const online = !row.logout_at;
                const color  = deptColor(row.course);
                return (
                  <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.3fr 1.5fr 1fr', padding: '12px 18px', borderBottom: '1px solid #f9fafb', alignItems: 'center', background: online ? '#f9fff9' : '#fff' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F1422' }}>{row.full_name || row.user_id || '—'}</span>
                      <span style={{ fontSize: '0.71rem', color: '#9ca3af' }}>{row.user_id}</span>
                    </div>
                    <div>
                      {row.course
                        ? <span style={{ background: color + '18', color, borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700 }}>{row.course}</span>
                        : <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{row.role || 'Staff'}</span>
                      }
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#6b7280' }}>{fmtTime(row.login_at)}</div>
                    <div>
                      {online
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#edf7f1', color: '#10813f', borderRadius: 20, padding: '3px 8px', fontSize: '0.69rem', fontWeight: 700 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10813f', display: 'inline-block' }} />Online
                          </span>
                        : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f3f4f6', color: '#9ca3af', borderRadius: 20, padding: '3px 8px', fontSize: '0.69rem', fontWeight: 700 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#9ca3af', display: 'inline-block' }} />Logged out
                          </span>
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SYSTEM VISITS ── */}
      {subTab === 'visits' && (
        <div className="db-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: '#0F1422' }}>System Visits</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
                {loading ? 'Loading...' : `${filteredVisits.length} visit${filteredVisits.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <LiveDot />
          </div>

          {loading ? (
            <div className="db-empty-state"><p>Loading…</p></div>
          ) : filteredVisits.length === 0 ? (
            <div className="db-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              <p>No system visits recorded.</p>
              <span>{search ? 'Try a different search.' : 'Visits appear when students open a service.'}</span>
            </div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1.3fr', padding: '8px 18px', background: '#f9fafb', borderBottom: '1px solid #f3f4f6', ...colH }}>
                <span>Student No.</span><span>Service Visited</span><span>When</span>
              </div>
              {filteredVisits.map(row => {
                const sys = SYSTEM_META[row.system_id] || { label: row.system_label, color: '#6b7280', bg: '#f3f4f6' };
                return (
                  <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1.3fr', padding: '12px 18px', borderBottom: '1px solid #f9fafb', alignItems: 'center', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#6b7280' }}>
                        {row.user_id ? row.user_id.charAt(0).toUpperCase() : '?'}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0F1422' }}>{row.user_id || 'Anonymous'}</span>
                    </div>
                    <div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: sys.bg || '#f3f4f6', color: sys.color, borderRadius: 20, padding: '4px 12px', fontSize: '0.78rem', fontWeight: 700 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: sys.color, display: 'inline-block' }} />
                        {sys.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#6b7280' }}>{fmtTime(row.visited_at)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
};

/* ── HistoryPage — wraps content in DashboardShell ────────── */
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
