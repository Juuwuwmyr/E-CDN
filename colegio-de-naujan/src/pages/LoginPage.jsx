import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import cdnLogo from '../assets/images/logo.png';
import bagongPilipinasLogo from '../assets/images/bagong-pilipinas-seeklogo.png';

const VALID_USERS = [
  { username: 'admin', password: 'bsis2026', name: 'Administrator', role: 'Admin' },
  { username: 'bsis',  password: 'cdn2026',  name: 'BSIS Student',  role: 'Student' },
];

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  // If already logged in, redirect
  useEffect(() => {
    const session = localStorage.getItem('cdn_user');
    if (session) navigate('/dashboard', { replace: true });
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const match = VALID_USERS.find(
        (u) => u.username === username.trim() && u.password === password
      );
      if (match) {
        const userData = { username: match.username, name: match.name, role: match.role };
        localStorage.setItem('cdn_user', JSON.stringify(userData));
        onLogin(userData);
        navigate('/dashboard', { replace: true });
      } else {
        setError('Invalid username or password.');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="lp-root">
      {/* ── Left brand panel ── */}
      <div className="lp-brand">
        <div className="lp-brand-noise" aria-hidden="true" />
        <div className="lp-brand-stripe" aria-hidden="true" />
        <div className="lp-brand-stripe lp-brand-stripe--2" aria-hidden="true" />

        <div className="lp-brand-content">
          {/* Logo row */}
          <div className="lp-brand-logo-row">
            <img src={cdnLogo} alt="CDN Logo" className="lp-brand-logo" />
            <div className="lp-brand-logo-text">
              <span className="lp-brand-school">Colegio De Naujan</span>
              <span className="lp-brand-official">Official E-Portal</span>
            </div>
          </div>

          <div className="lp-brand-divider" />

          <div className="lp-brand-badge">
            <span className="lp-brand-badge-dot" />
            CDN Portal — Authorized Users Only
          </div>

          <h1 className="lp-brand-title">
            Welcome to<br />
            <span className="lp-brand-title-accent">CDN E-Portal</span>
          </h1>

          <p className="lp-brand-sub">
            Access all Colegio De Naujan systems and services<br />
            from one unified platform.
          </p>

          {/* System pills */}
          <div className="lp-system-pills">
            {[
              { label: 'CSC Fines', color: '#002280' },
              { label: 'OSAS', color: '#C8102E' },
              { label: 'Admissions', color: '#C8960C' },
              { label: 'Student Portal', color: '#10813f' },
            ].map((s) => (
              <span key={s.label} className="lp-system-pill" style={{ '--pill-color': s.color }}>
                <span className="lp-system-pill-dot" style={{ background: s.color }} />
                {s.label}
              </span>
            ))}
          </div>

          <blockquote className="lp-brand-quote">
            "Education that produces — not just graduates, but builders."
          </blockquote>
        </div>

        {/* Bagong Pilipinas watermark */}
        <div className="lp-brand-footer">
          <img src={bagongPilipinasLogo} alt="Bagong Pilipinas" className="lp-bagong-logo" />
          <span className="lp-bagong-text">Bagong Pilipinas</span>
        </div>

        <div className="lp-corner-accent" aria-hidden="true" />
      </div>

      {/* ── Right form panel ── */}
      <div className="lp-form-side">
        {/* Mobile logo */}
        <div className="lp-mobile-logo">
          <img src={cdnLogo} alt="CDN Logo" className="lp-mobile-logo-img" />
          <div>
            <p className="lp-mobile-school">Colegio De Naujan</p>
            <p className="lp-mobile-dept">E-Portal</p>
          </div>
        </div>

        <div className="lp-form-card">
          {/* eGov-style portal header */}
          <div className="lp-portal-header">
            <div className="lp-portal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            </div>
            <div>
              <p className="lp-portal-eyebrow">CDN E-Portal</p>
              <h2 className="lp-portal-title">Sign In</h2>
            </div>
          </div>

          <p className="lp-portal-hint">
            Enter your CDN credentials to access the portal and all connected systems.
          </p>

          <form onSubmit={handleSubmit} className="lp-form" noValidate>
            {/* Username */}
            <div className="lp-field">
              <label htmlFor="lp-username" className="lp-label">Username</label>
              <div className="lp-input-wrap">
                <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
                </svg>
                <input
                  id="lp-username"
                  type="text"
                  className="lp-input"
                  placeholder="e.g. admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="lp-field">
              <label htmlFor="lp-password" className="lp-label">Password</label>
              <div className="lp-input-wrap">
                <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <input
                  id="lp-password"
                  type={showPass ? 'text' : 'password'}
                  className="lp-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="lp-pass-toggle"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="lp-error" role="alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              className={`lp-submit${loading ? ' lp-loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <span className="lp-spinner" />
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  Sign In to Portal
                </>
              )}
            </button>
          </form>

          <p className="lp-footer-note">
            For account access, contact the CDN website administrator.
          </p>
        </div>

        <p className="lp-copyright">
          © {new Date().getFullYear()} Colegio De Naujan · All rights reserved
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
