import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import '../../styles/login-analytics.css';
import {
  getActiveSessions,
  subscribeToActiveSessions,
} from '../../lib/auth';

// Department config — maps course codes used in portal_sessions to display info
const DEPARTMENTS = [
  { key: 'BSIS',        label: 'BSIS',        color: '#002280' },
  { key: 'BPA',         label: 'BPA',         color: '#C8102E' },
  { key: 'BTVTED-WFT',  label: 'BTVTED-WFT',  color: '#C8960C' },
  { key: 'BTVTED-CHS',  label: 'BTVTED-CHS',  color: '#7c3aed' },
];

// Map any course/role string to a department key for grouping
const resolveDept = (course) => {
  if (!course) return null;
  const u = course.toUpperCase();
  if (u.includes('BSIS'))         return 'BSIS';
  if (u.includes('WFT'))          return 'BTVTED-WFT';
  if (u.includes('CHS'))          return 'BTVTED-CHS';
  if (u.includes('BPA'))          return 'BPA';
  return null; // admin/staff — not shown in dept chart
};

const fmtLoginTime = (isoStr) => {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1)   return 'just now';
  if (diffMin < 60)  return diffMin + 'm ago';
  if (diffMin < 1440) return Math.floor(diffMin / 60) + 'h ago';
  return Math.floor(diffMin / 1440) + 'd ago';
};

const LoginAnalytics = () => {
  const [sessions,   setSessions]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [dbError,    setDbError]    = useState(null);   // show if DB read fails
  const [chartType,  setChartType]  = useState('bar');

  /* ── Fetch from Supabase ── */
  const fetchSessions = async () => {
    try {
      const data = await getActiveSessions();
      setSessions(data);
      setDbError(null);
    } catch (e) {
      setDbError('Could not load sessions. Check Supabase permissions.');
      console.error('fetchSessions error:', e);
    } finally {
      setLoading(false);
    }
  };

  /* ── Mount: initial fetch + Realtime subscription + polling fallback ── */
  useEffect(() => {
    fetchSessions();

    // Realtime subscription — instant push when someone logs in/out
    const channel = subscribeToActiveSessions(() => {
      fetchSessions();
    });

    // Polling fallback every 5 seconds in case Realtime isn't configured
    const pollInterval = setInterval(() => {
      fetchSessions();
    }, 5000);

    return () => {
      channel.unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);


  /* ── Derived data ── */

  // Only student sessions (with a resolvable department)
  const studentSessions = sessions.filter(s => resolveDept(s.course) !== null);

  // Currently logged-in students with resolved dept
  const activeUsers = studentSessions.map(s => ({
    ...s,
    dept: resolveDept(s.course),
  }));

  const totalActiveUsers = activeUsers.length;

  // Bar/Pie chart data — count per department (currently active only)
  const chartData = DEPARTMENTS.map(dept => {
    const count = activeUsers.filter(u => u.dept === dept.key).length;
    const shortName = dept.key.replace('BTVTED-', '');
    return { name: shortName, fullName: dept.key, logins: count, color: dept.color };
  });

  // Time-series: active logins in 5-min buckets over the last 60 min
  const timeSeriesData = (() => {
    const now = Date.now();
    return Array.from({ length: 12 }, (_, i) => {
      const slotCenter = now - (11 - i) * 5 * 60 * 1000;
      const slotStart  = slotCenter - 2.5 * 60 * 1000;
      const slotEnd    = slotCenter + 2.5 * 60 * 1000;
      // Count sessions whose login_at falls inside this 5-min window
      const count = sessions.filter(s => {
        const t = new Date(s.login_at).getTime();
        return t >= slotStart && t <= slotEnd;
      }).length;
      return {
        time: new Date(slotCenter).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        count,
      };
    });
  })();

  /* ── Custom tooltip ── */
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="analytics-tooltip">
          <p className="analytics-tooltip-label">{payload[0].payload.fullName || payload[0].payload.name}</p>
          <p className="analytics-tooltip-value">{payload[0].value} active</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="login-analytics-root">
      {/* DB error banner — shown if Supabase SELECT policy is missing */}
      {dbError && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10,
          padding: '10px 16px', marginBottom: 16, fontSize: '0.85rem', color: '#991b1b',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {dbError}
        </div>
      )}
      <div className="analytics-header">
        <div>
          <h2 className="analytics-title">Live Login Analytics</h2>
          <p className="analytics-subtitle">
            Real-time active users — updates instantly when students log in or out
          </p>
        </div>
        <div className="analytics-controls">
          <button
            className={`analytics-btn ${chartType === 'bar' ? 'active' : ''}`}
            onClick={() => setChartType('bar')}
            title="Bar Chart"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="2" x2="12" y2="22" />
              <path d="M17 5H9a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2z" />
            </svg>
          </button>
          <button
            className={`analytics-btn ${chartType === 'line' ? 'active' : ''}`}
            onClick={() => setChartType('line')}
            title="Line Chart"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </button>
          <button
            className={`analytics-btn ${chartType === 'pie' ? 'active' : ''}`}
            onClick={() => setChartType('pie')}
            title="Pie Chart"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2v10l7.07 7.07" />
            </svg>
          </button>
        </div>
      </div>


      {/* Charts */}
      <div className="analytics-charts">
        <div className="analytics-chart-container">
          <div className="analytics-chart-header">
            <h3 className="analytics-chart-title">Active Logins by Department</h3>
            <span className="analytics-chart-meta">Live — updates instantly</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            {chartType === 'bar' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="logins" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            ) : chartType === 'line' ? (
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="count" stroke="#002280" strokeWidth={2} dot={{ fill: '#002280', r: 4 }} />
              </LineChart>
            ) : (
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, logins }) => logins > 0 ? `${name}: ${logins}` : ''}
                  outerRadius={100}
                  dataKey="logins"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} users`, 'Active']} />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Time Series Chart */}
        <div className="analytics-chart-container">
          <div className="analytics-chart-header">
            <h3 className="analytics-chart-title">Active Users Timeline</h3>
            <span className="analytics-chart-meta">Last 60 minutes</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#10813f"
                strokeWidth={3}
                dot={{ fill: '#10813f', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Currently Active Users — the main real-time list */}
      <div className="analytics-active-users">
        <div className="analytics-chart-header">
          <h3 className="analytics-chart-title">Currently Active Users</h3>
          <span className="analytics-chart-meta">
            {loading ? 'Loading…' : `${activeUsers.length} online`}
            <span style={{
              display: 'inline-block',
              width: 8, height: 8,
              borderRadius: '50%',
              background: activeUsers.length > 0 ? '#10813f' : '#d1d5db',
              marginLeft: 6,
              verticalAlign: 'middle',
              animation: activeUsers.length > 0 ? 'pulse 2s infinite' : 'none',
            }} />
          </span>
        </div>

        {loading ? (
          <div className="analytics-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6v6l4 2" />
            </svg>
            <p>Loading active sessions…</p>
          </div>
        ) : activeUsers.length > 0 ? (
          <div className="analytics-table">
            <div className="analytics-table-header">
              <div className="analytics-table-cell">Department</div>
              <div className="analytics-table-cell">Name</div>
              <div className="analytics-table-cell">Username</div>
              <div className="analytics-table-cell">Logged in</div>
            </div>
            {activeUsers.map((u) => {
              const dept = DEPARTMENTS.find(d => d.key === u.dept);
              return (
                <div key={u.id} className="analytics-table-row">
                  <div className="analytics-table-cell">
                    <span
                      className="analytics-dept-badge"
                      style={{ background: dept?.color || '#ccc', color: '#fff' }}
                    >
                      {u.dept}
                    </span>
                  </div>
                  <div className="analytics-table-cell">{u.full_name || '—'}</div>
                  <div className="analytics-table-cell">{u.user_id}</div>
                  <div className="analytics-table-cell analytics-table-time">
                    {fmtLoginTime(u.login_at)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="analytics-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12h8M12 8v8" />
            </svg>
            <p>No active users at the moment</p>
          </div>
        )}
      </div>

      {/* Recent Logins from active sessions */}
      <div className="analytics-recent-logins">
        <div className="analytics-chart-header">
          <h3 className="analytics-chart-title">Recent Logins</h3>
          <span className="analytics-chart-meta">{sessions.length} active session{sessions.length !== 1 ? 's' : ''}</span>
        </div>

        {sessions.length > 0 ? (
          <div className="analytics-table">
            <div className="analytics-table-header">
              <div className="analytics-table-cell">Department</div>
              <div className="analytics-table-cell">Username</div>
              <div className="analytics-table-cell">Time</div>
            </div>
            {sessions.slice(0, 10).map((s, idx) => {
              const dept = DEPARTMENTS.find(d => d.key === resolveDept(s.course));
              return (
                <div key={idx} className="analytics-table-row">
                  <div className="analytics-table-cell">
                    <span
                      className="analytics-dept-badge"
                      style={{ background: dept?.color || '#6b7280', color: '#fff' }}
                    >
                      {resolveDept(s.course) || s.role || 'Staff'}
                    </span>
                  </div>
                  <div className="analytics-table-cell">{s.user_id}</div>
                  <div className="analytics-table-cell analytics-table-time">
                    {new Date(s.login_at).toLocaleTimeString('en-US', {
                      hour: '2-digit', minute: '2-digit', second: '2-digit',
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="analytics-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
              <path d="M12 6v6m0 4v.01" />
            </svg>
            <p>No active sessions recorded yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginAnalytics;

// Keep recordLogin / recordLogout named exports for backward-compat
// (Dashboard.jsx and Login.jsx still import these — they can stay as no-ops
//  since the real recording now happens via auth.js → Supabase)
export const recordLogin  = () => {};
export const recordLogout = () => {};
