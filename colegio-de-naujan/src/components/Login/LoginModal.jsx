import { useState, useEffect } from 'react';
import './LoginModal.css';
import cdnLogo from '../../assets/images/logo.png';

const VALID_USERS = [
  { username: 'admin', password: 'bsis2026' },
  { username: 'bsis',  password: 'cdn2026'  },
];

const LoginModal = ({ onLogin, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  /* close on Escape key */
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  /* lock body scroll while open */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

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
    <div className="lm-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="lm-panel" role="dialog" aria-modal="true" aria-label="Sign in to portal">

        {/* Close button */}
        <button className="lm-close" onClick={onClose} aria-label="Close login">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6"  y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Header */}
        <div className="lm-header">
          <div className="lm-logo-row">
            <img src={cdnLogo} alt="CDN Logo" className="lm-logo" />
            <div>
              <p className="lm-school">Colegio De Naujan</p>
              <p className="lm-dept">BSIS Project Portal</p>
            </div>
          </div>

          <div className="lm-title-group">
            <span className="lm-eyebrow">Restricted Access</span>
            <h2 className="lm-title">Sign In</h2>
            <p className="lm-hint">
              Enter your CDN credentials to access the BSIS project showcase.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="lm-form" noValidate>
          {/* Username */}
          <div className="lm-field">
            <label htmlFor="lm-username" className="lm-label">Username</label>
            <div className="lm-input-wrap">
              <svg className="lm-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7"/>
              </svg>
              <input
                id="lm-username"
                type="text"
                className="lm-input"
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
          <div className="lm-field">
            <label htmlFor="lm-password" className="lm-label">Password</label>
            <div className="lm-input-wrap">
              <svg className="lm-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <input
                id="lm-password"
                type={showPass ? 'text' : 'password'}
                className="lm-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="lm-pass-toggle"
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

          {/* Error */}
          {error && (
            <div className="lm-error" role="alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className={`lm-submit${loading ? ' loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <span className="lm-spinner" />
            ) : (
              <>
                Access BSIS Projects
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </>
            )}
          </button>
        </form>

        <p className="lm-footer-note">
          For account access, contact the BSIS department coordinator.
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
