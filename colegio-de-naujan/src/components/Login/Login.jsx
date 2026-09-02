import { useState } from 'react';
import './Login.css';
import cdnLogo from '../../assets/images/logo.png';

const VALID_USERS = [
  { username: 'admin',   password: 'bsis2026' },
  { username: 'bsis',    password: 'cdn2026'  },
];

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const match = VALID_USERS.find(
        (u) => u.username === username.trim() && u.password === password
      );
      if (match) {
        onLogin();
      } else {
        setError('Invalid username or password.');
        setLoading(false);
      }
    }, 700);
  };

  return (
    <div className="login-root">
      
      <div className="login-brand-panel">
        <div className="login-brand-noise" aria-hidden="true" />
        <div className="login-brand-stripe" aria-hidden="true" />

        <div className="login-brand-content">
          <div className="login-brand-badge">
            <span className="login-brand-badge-dot" />
            CDN E-Portal
          </div>

          <h1 className="login-brand-title">
            Colegio<br />
            <span className="login-brand-title-accent">De Naujan</span>
          </h1>

          <p className="login-brand-sub">
            College Department<br />
            Project Showcase System
          </p>

          <div className="login-brand-course-tag">
            <span className="login-course-pill">BSIS</span>
            <span className="login-course-pill login-course-pill--dim">BTVTED-WFT</span>
            <span className="login-course-pill login-course-pill--dim">BTVTED-CHS</span>
            <span className="login-course-pill login-course-pill--dim">WFT</span>
          </div>

          <div className="login-brand-quote">
            "Education that produces — not just graduates, but builders."
          </div>
        </div>

        
        <div className="login-corner-block" aria-hidden="true">
          <div className="login-corner-inner" />
        </div>
      </div>

      
      <div className="login-form-panel">
        
        <div className="login-form-logo">
          <img src={cdnLogo} alt="CDN Logo" className="login-logo-img" />
          <div className="login-logo-text">
            <span className="login-logo-school">Colegio De Naujan</span>
            <span className="login-logo-dept">College Dept.</span>
          </div>
        </div>

        <div className="login-form-box">
          <div className="login-form-heading-group">
            <span className="login-form-eyebrow">Restricted Access</span>
            <h2 className="login-form-heading">Sign In</h2>
            <p className="login-form-hint">
              Enter your CDN credentials to access the project portal.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            
            <div className="login-field">
              <label htmlFor="login-username" className="login-label">
                Username
              </label>
              <div className="login-input-wrap">
                <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
                </svg>
                <input
                  id="login-username"
                  type="text"
                  className="login-input"
                  placeholder="e.g. admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            
            <div className="login-field">
              <label htmlFor="login-password" className="login-label">
                Password
              </label>
              <div className="login-input-wrap">
                <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className="login-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="login-pass-toggle"
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
              <div className="login-error" role="alert">
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
              className={`login-submit${loading ? ' loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <span className="login-spinner" />
              ) : (
                <>
                  Access Portal
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="login-form-footer-note">
            For account access, contact the BSIS department coordinator.
          </p>
        </div>

        <p className="login-copyright">
          © {new Date().getFullYear()} Colegio De Naujan · College Department
        </p>
      </div>
    </div>
  );
};

export default Login;
