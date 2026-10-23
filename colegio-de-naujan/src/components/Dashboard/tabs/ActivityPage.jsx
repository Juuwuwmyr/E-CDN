/**
 * ActivityPage — "Activity" tab content
 * Shows stat cards with live portal metrics + under-construction placeholder.
 */
import { useState, useEffect } from 'react';
import { getPortalMetrics, subscribeToSystemVisits } from '../../../lib/auth';
import { fmt } from '../constants';

const ActivityPage = ({ user }) => {
  const [metrics, setMetrics] = useState({ totalSessions: 0, todaySessions: 0, totalClicks: 0, deptSessions: {} });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const m = await getPortalMetrics();
      setMetrics(m);
    } catch (e) {
      console.error('ActivityPage fetchData:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const ch   = subscribeToSystemVisits(() => fetchData());
    const poll = setInterval(fetchData, 10000);
    return () => { ch.unsubscribe(); clearInterval(poll); };
  }, []);

  const deptTotal = Object.values(metrics.deptSessions || {}).reduce((a, b) => a + b, 0);
  const topDept   = deptTotal > 0
    ? Object.entries(metrics.deptSessions).sort((a, b) => b[1] - a[1])[0]?.[0]
    : null;

  const STAT_CARDS = [
    {
      label: 'Total Login Sessions',
      value: loading ? '…' : fmt(metrics.totalSessions),
      sub:   loading ? '…' : `${metrics.todaySessions} today`,
      color: '#002280', bg: '#eef1fb',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
    {
      label: 'System Clicks',
      value: loading ? '…' : fmt(metrics.totalClicks),
      sub:   'across all services',
      color: '#C8960C', bg: '#fdf8ec',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
    },
    {
      label: 'Today\'s Sessions',
      value: loading ? '…' : fmt(metrics.todaySessions),
      sub:   'logged in today',
      color: '#10813f', bg: '#edf7f1',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8"  y1="2" x2="8"  y2="6"/>
          <line x1="3"  y1="10" x2="21" y2="10"/>
        </svg>
      ),
    },
    {
      label: 'Top Department',
      value: loading ? '…' : (topDept ?? 'None'),
      sub:   loading ? '…' : (topDept ? `${metrics.deptSessions[topDept]} sessions` : 'No activity yet'),
      color: '#7c3aed', bg: '#f5f0ff',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
          <polyline points="17 6 23 6 23 12"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="db-home-content" style={{ paddingBottom: "4rem" }}>

      {/* Stat cards */}
      <div className="db-stats-row" style={{ marginBottom: "1.5rem" }}>
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

      {/* Under maintenance body */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '60px 24px', textAlign: 'center',
        background: '#fff', borderRadius: 16, border: '1px solid #e4e8f2',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20, background: '#fdf8ec',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20, color: '#C8960C',
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F1422' }}>
          Under Maintenance
        </h2>
        <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: '#6b7280', maxWidth: 320 }}>
          Detailed activity charts are being updated. Check back soon.
        </p>
      </div>
    </div>
  );
};

export default ActivityPage;
