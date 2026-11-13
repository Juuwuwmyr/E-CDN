import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import '../../styles/login-analytics.css';
import {
  getActiveSessions,
  subscribeToActiveSessions,
} from '../../lib/auth';

const DEPARTMENTS = [
  { key: 'BSIS',       label: 'BSIS',       color: '#002280', bg: '#eef1fb' },
  { key: 'BPA',        label: 'BPA',        color: '#C8102E', bg: '#fdf0f2' },
  { key: 'BTVTED-WFT', label: 'WFT',        color: '#C8960C', bg: '#fdf8ec' },
  { key: 'BTVTED-CHS', label: 'CHS',        color: '#7c3aed', bg: '#f5f0ff' },
];

const resolveDept = (course) => {
  if (!course) return null;
  const u = course.toUpperCase();
  if (u.includes('BSIS')) return 'BSIS';
  if (u.includes('WFT'))  return 'BTVTED-WFT';
  if (u.includes('CHS'))  return 'BTVTED-CHS';
  if (u.includes('BPA'))  return 'BPA';
  return null;
};

/* ── Custom Tooltip ── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0f1724', borderRadius: 8, padding: '8px 14px',
      boxShadow: '0 4px 16px rgba(0,0,0,.18)',
    }}>
      {label && <p style={{ margin: '0 0 4px', fontSize: '.72rem', color: 'rgba(255,255,255,.55)', fontWeight: 600 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ margin: 0, fontSize: '.85rem', fontWeight: 700, color: p.color || '#fff' }}>
          {p.value} {p.name === 'logins' ? 'active' : 'sessions'}
        </p>
      ))}
    </div>
  );
};

const LoginAnalytics = () => {
  const [sessions,  setSessions]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [dbError,   setDbError]   = useState(null);
  const [chartType, setChartType] = useState('bar');

  const fetchSessions = async () => {
    try {
      const data = await getActiveSessions();
      setSessions(data);
      setDbError(null);
    } catch (e) {
      setDbError('Could not load sessions.');
      console.error('fetchSessions error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const channel  = subscribeToActiveSessions(fetchSessions);
    const interval = setInterval(fetchSessions, 30000);
    return () => { channel.unsubscribe(); clearInterval(interval); };
  }, []);

  /* ── Derived data ── */
  const activeUsers = sessions
    .filter(s => resolveDept(s.course) !== null)
    .map(s => ({ ...s, dept: resolveDept(s.course) }));

  const chartData = DEPARTMENTS.map(dept => ({
    name:     dept.label,
    fullName: dept.key,
    logins:   activeUsers.filter(u => u.dept === dept.key).length,
    color:    dept.color,
    bg:       dept.bg,
  }));

  const timeSeriesData = (() => {
    const now = Date.now();
    return Array.from({ length: 12 }, (_, i) => {
      const center = now - (11 - i) * 5 * 60 * 1000;
      const start  = center - 2.5 * 60 * 1000;
      const end    = center + 2.5 * 60 * 1000;
      const count  = sessions.filter(s => {
        const t = new Date(s.login_at).getTime();
        return t >= start && t <= end;
      }).length;
      return {
        time:  new Date(center).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        count,
      };
    });
  })();

  const totalActive = activeUsers.length;
  const maxDept     = chartData.sort((a, b) => b.logins - a.logins)[0];
  const hasData     = totalActive > 0;

  const CHART_TYPES = [
    { key: 'bar', label: 'Bar',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3H3v18h2V3zm4 6H7v12h2V9zm4-4h-2v16h2V5zm4 8h-2v8h2v-8z"/></svg> },
    { key: 'line', label: 'Line',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3.5 18.5l6-6 4 4L22 6.92"/><path d="M3.5 18.5l6-6 4 4" fillOpacity="0"/></svg> },
    { key: 'pie', label: 'Pie',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></svg> },
  ];

  return (
    <div style={{
      background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb',
      overflow: 'hidden', marginTop: 20,
    }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 1.5rem', borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9, background: '#eef1fb', color: '#002280',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '.95rem', fontWeight: 800, color: '#0f1724' }}>Live Login Analytics</p>
            <p style={{ margin: 0, fontSize: '.72rem', color: '#94a3b8' }}>
              {loading ? 'Loading…' : hasData ? `${totalActive} active session${totalActive !== 1 ? 's' : ''}` : 'No active sessions right now'}
            </p>
          </div>
        </div>

        {/* Chart type toggle */}
        <div style={{ display: 'flex', gap: 4, background: '#f4f6fb', borderRadius: 10, padding: 4 }}>
          {CHART_TYPES.map(t => (
            <button key={t.key} onClick={() => setChartType(t.key)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontSize: '.75rem', fontWeight: 700, fontFamily: 'inherit',
              background: chartType === t.key ? '#fff' : 'transparent',
              color:      chartType === t.key ? '#002280' : '#94a3b8',
              boxShadow:  chartType === t.key ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
              transition: 'all .15s',
            }}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {dbError && (
        <div style={{ margin: '0 1.5rem 0', padding: '8px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: '.82rem', color: '#991b1b', marginTop: 12 }}>
          {dbError}
        </div>
      )}

      {/* ── KPI mini-cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, borderBottom: '1px solid #f3f4f6' }}>
        {DEPARTMENTS.map(dept => {
          const count = activeUsers.filter(u => u.dept === dept.key).length;
          return (
            <div key={dept.key} style={{
              padding: '1rem 1.25rem', borderRight: '1px solid #f3f4f6',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: dept.color, flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: dept.color, lineHeight: 1 }}>{loading ? '—' : count}</p>
                <p style={{ margin: '2px 0 0', fontSize: '.68rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.04em' }}>{dept.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 0, padding: '1.25rem 1.5rem' }}>

        {/* Left — Dept chart */}
        <div style={{ paddingRight: '1.5rem', borderRight: '1px solid #f3f4f6' }}>
          <p style={{ margin: '0 0 .75rem', fontSize: '.82rem', fontWeight: 700, color: '#374151' }}>
            Active Logins by Department
          </p>
          {!hasData ? (
            <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#d1d5db' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" style={{ marginBottom: 8, opacity: .3 }}>
                <path d="M5 3H3v18h2V3zm4 6H7v12h2V9zm4-4h-2v16h2V5zm4 8h-2v8h2v-8z"/>
              </svg>
              <p style={{ margin: 0, fontSize: '.8rem', fontWeight: 600 }}>No active logins</p>
            </div>
          ) : chartType === 'pie' ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData.filter(d => d.logins > 0)}
                  cx="50%" cy="50%"
                  outerRadius={80} innerRadius={40}
                  dataKey="logins" paddingAngle={3}
                  label={({ name, logins }) => `${name} ${logins}`}
                  labelLine={false}
                >
                  {chartData.filter(d => d.logins > 0).map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barCategoryGap="40%" margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} domain={[0, d => Math.max(d + 1, 5)]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,34,128,.04)' }} />
                <Bar dataKey="logins" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Right — Timeline */}
        <div style={{ paddingLeft: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
            <p style={{ margin: 0, fontSize: '.82rem', fontWeight: 700, color: '#374151' }}>Session Timeline</p>
            <span style={{ fontSize: '.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>Last 60 min</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timeSeriesData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false} tickLine={false}
                interval={3}
              />
              <YAxis
                allowDecimals={false}
                domain={[0, d => Math.max(d + 1, 5)]}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false} tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#002280" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#002280" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Line
                type="monotone"
                dataKey="count"
                stroke="#002280"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#002280', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default LoginAnalytics;

export const recordLogin  = () => {};
export const recordLogout = () => {};
