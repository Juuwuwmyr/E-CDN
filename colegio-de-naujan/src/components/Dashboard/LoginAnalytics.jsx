import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import '../../styles/login-analytics.css';

const DEPARTMENTS = [
  { name: 'BSIS', color: '#002280' },
  { name: 'BTVTED-WFT', color: '#C8102E' },
  { name: 'BTVTED-CHS', color: '#C8960C' },
  { name: 'WFT', color: '#7c3aed' },
  { name: 'Admin', color: '#10813f' },
];

const LOGIN_ANALYTICS_KEY = 'cdn_login_analytics';
const ACTIVE_SESSIONS_KEY = 'cdn_active_sessions';

// Get login analytics data
const getLoginAnalytics = () => {
  try {
    return JSON.parse(localStorage.getItem(LOGIN_ANALYTICS_KEY)) || {
      logins: [],
      byDepartment: {},
    };
  } catch {
    return { logins: [], byDepartment: {} };
  }
};

// Save login analytics
const saveLoginAnalytics = (data) => {
  localStorage.setItem(LOGIN_ANALYTICS_KEY, JSON.stringify(data));
};

// Get active sessions (currently logged-in users)
const getActiveSessions = () => {
  try {
    return JSON.parse(localStorage.getItem(ACTIVE_SESSIONS_KEY)) || {};
  } catch {
    return {};
  }
};

// Save active sessions
const saveActiveSessions = (sessions) => {
  localStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(sessions));
};

// Record a login - add to active sessions
export const recordLogin = (department, username, userIdentifier) => {
  const analytics = getLoginAnalytics();
  
  // Record login event in history
  analytics.logins = analytics.logins || [];
  const loginRecord = {
    department,
    username,
    timestamp: Date.now(),
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
  analytics.logins.unshift(loginRecord);
  
  // Keep only last 200 logins
  analytics.logins = analytics.logins.slice(0, 200);
  
  saveLoginAnalytics(analytics);
  
  // Add to active sessions
  const activeSessions = getActiveSessions();
  const sessionId = userIdentifier || username;
  activeSessions[sessionId] = {
    department,
    username,
    loginTime: Date.now(),
  };
  saveActiveSessions(activeSessions);
};

// Record logout - remove from active sessions
export const recordLogout = (userIdentifier, username) => {
  const activeSessions = getActiveSessions();
  const sessionId = userIdentifier || username;
  delete activeSessions[sessionId];
  saveActiveSessions(activeSessions);
};

const LoginAnalytics = () => {
  const [analytics, setAnalytics] = useState(() => getLoginAnalytics());
  const [activeSessions, setActiveSessions] = useState(() => getActiveSessions());
  const [chartType, setChartType] = useState('bar'); // 'bar', 'line', 'pie'

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAnalytics(getLoginAnalytics());
      setActiveSessions(getActiveSessions());
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  // Prepare chart data - count only currently logged-in users by department
  const chartData = DEPARTMENTS.map((dept) => {
    const activeInDept = Object.values(activeSessions).filter(
      (session) => session.department === dept.name
    ).length;
    return {
      name: dept.name,
      logins: activeInDept,
      color: dept.color,
    };
  });

  const totalActiveUsers = Object.keys(activeSessions).length;

  // Time-series data (active users over time - based on login history)
  const timeSeriesData = (() => {
    const now = Date.now();
    const intervals = Array.from({ length: 12 }, (_, i) => {
      const time = now - (11 - i) * 5 * 60 * 1000;
      const start = time - 2.5 * 60 * 1000;
      const end = time + 2.5 * 60 * 1000;
      
      // Count unique users who logged in during this interval
      const usersInInterval = (analytics.logins || []).filter(
        (l) => l.timestamp >= start && l.timestamp <= end
      );
      
      // Get unique count (one per user)
      const uniqueUsers = new Set(usersInInterval.map(l => l.username)).size;

      return {
        time: new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        count: uniqueUsers,
      };
    });
    return intervals;
  })();

  // Recent logins
  const recentLogins = (analytics.logins || []).slice(0, 10);
  
  // Active users list
  const activeUsersList = Object.entries(activeSessions).map(([id, session]) => ({
    id,
    ...session,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="analytics-tooltip">
          <p className="analytics-tooltip-label">{payload[0].payload.name}</p>
          <p className="analytics-tooltip-value">{payload[0].value} users</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="login-analytics-root">
      <div className="analytics-header">
        <div>
          <h2 className="analytics-title">Live Login Analytics</h2>
          <p className="analytics-subtitle">Real-time active users currently logged in</p>
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

      {/* Stats Cards */}
      <div className="analytics-stats">
        <div className="analytics-stat-card">
          <div className="analytics-stat-icon" style={{ background: '#eef1fb' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#002280" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="analytics-stat-content">
            <p className="analytics-stat-label">Active Users</p>
            <p className="analytics-stat-value">{totalActiveUsers}</p>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-stat-icon" style={{ background: '#fdf0f2' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#C8102E" strokeWidth="2">
              <path d="M4 4v5a1 1 0 001 1h4a1 1 0 001-1V4"/>
              <path d="M14 4v5a1 1 0 001 1h4a1 1 0 001-1V4"/>
              <path d="M4 14v5a1 1 0 001 1h4a1 1 0 001-1v-5"/>
              <path d="M14 14v5a1 1 0 001 1h4a1 1 0 001-1v-5"/>
            </svg>
          </div>
          <div className="analytics-stat-content">
            <p className="analytics-stat-label">Departments</p>
            <p className="analytics-stat-value">{DEPARTMENTS.length}</p>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-stat-icon" style={{ background: '#fdf8ec' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#C8960C" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6v6l4 2" />
            </svg>
          </div>
          <div className="analytics-stat-content">
            <p className="analytics-stat-label">Status</p>
            <p className="analytics-stat-value" style={{ color: totalActiveUsers > 0 ? '#10813f' : '#999' }}>
              {totalActiveUsers > 0 ? 'Online' : 'Idle'}
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="analytics-charts">
        <div className="analytics-chart-container">
          <div className="analytics-chart-header">
            <h3 className="analytics-chart-title">Logins by Department</h3>
            <span className="analytics-chart-meta">Current Session</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            {chartType === 'bar' && (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="logins" fill="#002280" radius={[8, 8, 0, 0]} />
              </BarChart>
            )}
            {chartType === 'line' && (
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="count" stroke="#002280" strokeWidth={2} dot={{ fill: '#002280', r: 4 }} />
              </LineChart>
            )}
            {chartType === 'pie' && (
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, logins }) => `${name}: ${logins}`}
                  outerRadius={100}
                  fill="#8884d8"
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
              <YAxis />
              <Tooltip 
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
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

      {/* Recent Logins Table */}
      <div className="analytics-recent-logins">
        <div className="analytics-chart-header">
          <h3 className="analytics-chart-title">Recent Logins</h3>
          <span className="analytics-chart-meta">{recentLogins.length} entries</span>
        </div>

        {recentLogins.length > 0 ? (
          <div className="analytics-table">
            <div className="analytics-table-header">
              <div className="analytics-table-cell">Department</div>
              <div className="analytics-table-cell">Username</div>
              <div className="analytics-table-cell">Time</div>
            </div>
            {recentLogins.map((login, idx) => {
              const dept = DEPARTMENTS.find(d => d.name === login.department);
              return (
                <div key={idx} className="analytics-table-row">
                  <div className="analytics-table-cell">
                    <span 
                      className="analytics-dept-badge" 
                      style={{ background: dept?.color || '#ccc', color: '#fff' }}
                    >
                      {login.department}
                    </span>
                  </div>
                  <div className="analytics-table-cell">{login.username}</div>
                  <div className="analytics-table-cell analytics-table-time">{login.time}</div>
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
            <p>No logins recorded yet</p>
          </div>
        )}
      </div>

      {/* Currently Active Users */}
      <div className="analytics-active-users">
        <div className="analytics-chart-header">
          <h3 className="analytics-chart-title">Currently Active Users</h3>
          <span className="analytics-chart-meta">{activeUsersList.length} online</span>
        </div>

        {activeUsersList.length > 0 ? (
          <div className="analytics-table">
            <div className="analytics-table-header">
              <div className="analytics-table-cell">Department</div>
              <div className="analytics-table-cell">Username</div>
              <div className="analytics-table-cell">Login Time</div>
            </div>
            {activeUsersList.map((user) => {
              const dept = DEPARTMENTS.find(d => d.name === user.department);
              const loginDuration = Math.round((Date.now() - user.loginTime) / 60000); // in minutes
              return (
                <div key={user.id} className="analytics-table-row">
                  <div className="analytics-table-cell">
                    <span 
                      className="analytics-dept-badge" 
                      style={{ background: dept?.color || '#ccc', color: '#fff' }}
                    >
                      {user.department}
                    </span>
                  </div>
                  <div className="analytics-table-cell">{user.username}</div>
                  <div className="analytics-table-cell analytics-table-time">
                    {loginDuration}m ago
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
    </div>
  );
};

export default LoginAnalytics;
