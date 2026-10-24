/**
 * Dashboard.jsx
 * ─────────────────────────────────────────────
 * Thin orchestrator — owns routing state only.
 * All chrome (topbar, sidebar, chatbot) lives in DashboardShell.
 * Each tab is its own isolated component.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { recordLogout }        from './LoginAnalytics';
import { recordLogoutSession } from '../../lib/auth';
import { logActivity }          from '../../lib/activityLogger';

import DashboardShell  from './DashboardShell';
import OverviewPage    from './tabs/OverviewPage';
import ActivityPage    from './tabs/ActivityPage';
import SystemsPage     from './tabs/SystemsPage';
import StudentsPage    from './tabs/StudentsPage';
import AccountsPage    from './tabs/AccountsPage';

/* ── tab → component map ─────────────────────────────────── */
const TAB_PAGES = {
  overview: OverviewPage,
  activity: ActivityPage,
  admin:    SystemsPage,
  students: StudentsPage,
  accounts: AccountsPage,
};

/* ── Dashboard ───────────────────────────────────────────── */
const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  /* derive active tab from ?tab= query param */
  const tabFromUrl = new URLSearchParams(location.search).get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  /* keep activeTab in sync when URL changes (back/forward) */
  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab') || 'overview';
    setActiveTab(tab);
  }, [location.search]);

  // Log login on mount
  useEffect(() => {
    logActivity('login', 'User logged into portal', user?.username, 'success', 'Portal');
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate('/dashboard' + (tab !== 'overview' ? '?tab=' + tab : ''), { replace: true });
  };

  const handleLogout = async () => {
    const sessionId = localStorage.getItem('cdn_session');
    await recordLogoutSession(sessionId);
    recordLogout(user.studentNumber || user.username, user.username);
    localStorage.removeItem('cdn_user');
    localStorage.removeItem('cdn_session');
    onLogout();
  };

  /* guard: admin-only tabs */
  const resolvedTab = (activeTab === 'admin' || activeTab === 'students' || activeTab === 'accounts') && user?.role?.toLowerCase() !== 'admin'
    ? 'overview'
    : activeTab;

  /* pick the right page component; fall back to OverviewPage */
  const PageComponent = TAB_PAGES[resolvedTab] ?? OverviewPage;

  return (
    <DashboardShell
      user={user}
      onLogout={handleLogout}
      activeTab={resolvedTab}
      onTabChange={handleTabChange}
      onRoute={(path) => navigate(path)}
      onDropdownItem={(label, tab) => {
        if (tab) handleTabChange(tab);
      }}
    >
      <PageComponent user={user} onLogout={handleLogout} />
    </DashboardShell>
  );
};

export default Dashboard;
