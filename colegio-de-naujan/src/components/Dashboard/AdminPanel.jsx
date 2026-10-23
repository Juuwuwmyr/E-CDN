import { useState } from 'react';
import SystemAppsManager from './SystemAppsManager';

const AdminPanel = ({ user, onLogout }) => {
  const [activeSection, setActiveSection] = useState('apps');

  const sections = [
    {
      key: 'apps',
      label: 'System Applications',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <path d="M8 21h8M12 17v4M7 8h10M7 12h6"/>
        </svg>
      ),
    },
    {
      key: 'users',
      label: 'User Management',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
        </svg>
      ),
    },
    {
      key: 'analytics',
      label: 'Analytics',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="20" x2="12" y2="10"/>
          <line x1="18" y1="20" x2="18" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="16"/>
        </svg>
      ),
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fb' }}>
      {/* Header */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F1422', margin: 0 }}>
            Admin Panel
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0, marginTop: 4 }}>
            Manage CDN E-Portal system applications and settings
          </p>
        </div>
        <button
          onClick={onLogout}
          style={{
            background: '#fef2f2',
            color: '#991b1b',
            border: 'none',
            borderRadius: 8,
            padding: '10px 20px',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </header>

      {/* Main Content */}
      <div style={{ display: 'flex', maxWidth: 1400, margin: '0 auto' }}>
        {/* Sidebar */}
        <aside style={{
          width: 260,
          background: '#fff',
          borderRight: '1px solid #e5e7eb',
          padding: '24px 0',
          minHeight: 'calc(100vh - 73px)',
        }}>
          <nav>
            {sections.map((section) => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                style={{
                  width: '100%',
                  background: activeSection === section.key ? '#f5f0ff' : 'transparent',
                  color: activeSection === section.key ? '#7c3aed' : '#6b7280',
                  border: 'none',
                  borderLeft: activeSection === section.key ? '3px solid #7c3aed' : '3px solid transparent',
                  padding: '12px 24px',
                  fontSize: '0.875rem',
                  fontWeight: activeSection === section.key ? 700 : 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ width: 20, height: 20 }}>
                  {section.icon}
                </div>
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <main style={{ flex: 1, padding: 24 }}>
          {activeSection === 'apps' && <SystemAppsManager />}
          
          {activeSection === 'users' && (
            <div className="db-panel">
              <div className="db-panel-header">
                <div className="db-panel-header-left">
                  <div className="db-panel-icon" style={{ background: '#eef1fb', color: '#002280' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="db-panel-title">User Management</h3>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 4 }}>
                      Manage portal users and permissions
                    </p>
                  </div>
                </div>
              </div>
              <div className="db-empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48, color: '#9ca3af' }}>
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                </svg>
                <p>User Management Coming Soon</p>
                <span>This feature is under development</span>
              </div>
            </div>
          )}

          {activeSection === 'analytics' && (
            <div className="db-panel">
              <div className="db-panel-header">
                <div className="db-panel-header-left">
                  <div className="db-panel-icon" style={{ background: '#fdf8ec', color: '#C8960C' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="20" x2="12" y2="10"/>
                      <line x1="18" y1="20" x2="18" y2="4"/>
                      <line x1="6" y1="20" x2="6" y2="16"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="db-panel-title">Analytics & Reports</h3>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 4 }}>
                      View portal usage statistics and reports
                    </p>
                  </div>
                </div>
              </div>
              <div className="db-empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48, color: '#9ca3af' }}>
                  <line x1="12" y1="20" x2="12" y2="10"/>
                  <line x1="18" y1="20" x2="18" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="16"/>
                </svg>
                <p>Analytics Coming Soon</p>
                <span>Advanced analytics features are under development</span>
              </div>
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="db-panel">
              <div className="db-panel-header">
                <div className="db-panel-header-left">
                  <div className="db-panel-icon" style={{ background: '#f3f4f6', color: '#374151' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="db-panel-title">Portal Settings</h3>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 4 }}>
                      Configure portal settings and preferences
                    </p>
                  </div>
                </div>
              </div>
              <div className="db-empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48, color: '#9ca3af' }}>
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
                </svg>
                <p>Settings Coming Soon</p>
                <span>Portal configuration settings are under development</span>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
