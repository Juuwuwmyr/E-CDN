/**
 * SystemsPage — "Systems" tab content (Admin only)
 * Stat cards with live system metrics + SystemAppsManager.
 */
import { useState, useEffect } from 'react';
import SystemAppsManager from '../SystemAppsManager';
import {
  getPortalMetrics,
  getSystemVisitStats,
  subscribeToSystemApplications,
} from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { fmt } from '../constants';

const SystemsPage = () => {
  const [totalApps,    setTotalApps]    = useState(0);
  const [activeApps,   setActiveApps]   = useState(0);
  const [totalClicks,  setTotalClicks]  = useState(0);
  const [topSystem,    setTopSystem]    = useState(null);
  const [loading,      setLoading]      = useState(true);

  const fetchStats = async () => {
    try {
      // App counts from system_applications
      const { data: appsData } = await supabase
        .from('system_applications')
        .select('id, is_active', { count: 'exact' });

      const all    = appsData?.length ?? 0;
      const active = appsData?.filter(a => a.is_active).length ?? 0;

      // Visit stats
      const [metrics, visitStats] = await Promise.all([
        getPortalMetrics(),
        getSystemVisitStats(),
      ]);

      // Top system by visits
      const topEntry = Object.entries(visitStats).sort((a, b) => b[1] - a[1])[0];

      setTotalApps(all);
      setActiveApps(active);
      setTotalClicks(metrics.totalClicks);
      setTopSystem(topEntry ? { id: topEntry[0], visits: topEntry[1] } : null);
    } catch (e) {
      console.error('SystemsPage fetchStats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const ch   = subscribeToSystemApplications(() => fetchStats());
    const poll = setInterval(fetchStats, 10000);
    return () => { ch.unsubscribe(); clearInterval(poll); };
  }, []);

  const STAT_CARDS = [
    {
      label: 'Total Systems',
      value: loading ? '…' : totalApps,
      sub:   'registered portals',
      color: '#002280', bg: '#eef1fb',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3"  y="14" width="7" height="7" rx="1"/>
          <path d="M17.5 14v6M14.5 17h6"/>
        </svg>
      ),
    },
    {
      label: 'Active Systems',
      value: loading ? '…' : activeApps,
      sub:   loading ? '…' : `${totalApps - activeApps} inactive`,
      color: '#10813f', bg: '#edf7f1',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
    },
    {
      label: 'Total System Clicks',
      value: loading ? '…' : fmt(totalClicks),
      sub:   'all-time visits',
      color: '#C8960C', bg: '#fdf8ec',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
    },
    {
      label: 'Most Used System',
      value: loading ? '…' : (topSystem?.id ?? 'None'),
      sub:   loading ? '…' : (topSystem ? `${topSystem.visits} clicks` : 'No visits yet'),
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

      {/* Systems manager */}
      <SystemAppsManager />
    </div>
  );
};

export default SystemsPage;
