import { useState, useEffect } from 'react';
import './LoginModal.css';
import cdnLogo from '../../assets/images/logo.png';
import { validateLogin, recordLoginSession, registerStudent } from '../../lib/auth';
import { recordLogin } from '../Dashboard/LoginAnalytics';

const EyeOpen = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const getPasswordStrength = (pw) => {
  if (!pw) return { level: 0, label: '', color: '' };
  const len = pw.length;
  const hasNum = /[0-9]/.test(pw);
  const hasSpec = /[^A-Za-z0-9]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  if (len < 8) return { level: 1, label: 'Weak', color: '#ef4444' };
  if (len >= 10 && hasNum && hasSpec && hasUpper) return { level: 4, label: 'Strong', color: '#22c55e' };
  if (len >= 8 && (hasNum || hasSpec)) return { level: 3, label: 'Good', color: '#3b82f6' };
  return { level: 2, label: 'Fair', color: '#f59e0b' };
};

const LoginModal = ({ onLogin, onClose }) => {
  const [tab, setTab] = useState('login'); // 'login' | 'register'

  // Login state
  const [username,  setUsername]  = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [loginErr,  setLoginErr]  = useState('');
  const [loginLoad, setLoginLoad] = useState(false);

  // Register state
  const [regSN,      setRegSN]      = useState('');
  const [regPass,    setRegPass]    = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showReg,    setShowReg]    = useState(false);
  const [showConf,   setShowConf]   = useState(false);
  const [regErr,     setRegErr]     = useState('');
  const [regLoad,    setRegLoad]    = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const switchTab = (t) => {
    setTab(t);
    setLoginErr(''); setRegErr(''); setRegSuccess(false);
  };

  /* ── LOGIN ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginErr('');
    setLoginLoad(true);
    try {
      const { ok, user, error } = await validateLogin(username, password);
      if (ok && user) {
        const { id: sessionId, token } = await recordLoginSession(user);
        // Record in local analytics for department charts
        recordLogin(user.course || user.role || 'Admin', user.username, user.username);
        localStorage.setItem('cdn_user', JSON.stringify(user));
        if (sessionId && token) {
          localStorage.setItem('cdn_session', String(sessionId));
          localStorage.setItem('cdn_token', token);
        } else {
          // Session row couldn't be created (or migration not applied):
          // never persist a session that can't be validated later.
          localStorage.removeItem('cdn_session');
          localStorage.removeItem('cdn_token');
        }
        onLogin();
      } else {
        setLoginErr(error || 'Invalid credentials.');
      }
    } catch {
      setLoginErr('Connection error. Please try again.');
    } finally {
      setLoginLoad(false);
    }
  };

  /* ── REGISTER ── */
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegErr('');
    if (regPass !== regConfirm) { setRegErr('Passwords do not match.'); return; }
    if (regPass.length < 8)     { setRegErr('Password must be at least 8 characters.'); return; }
    setRegLoad(true);
    try {
      const { ok, user, error } = await registerStudent(regSN, regPass);
      if (ok && user) {
        setRegSuccess(true);
        const { id: sessionId, token } = await recordLoginSession(user);
        recordLogin(user.course || 'Student', user.username, user.username);
        localStorage.setItem('cdn_user', JSON.stringify(user));
        if (sessionId && token) {
          localStorage.setItem('cdn_session', String(sessionId));
          localStorage.setItem('cdn_token', token);
        } else {
          localStorage.removeItem('cdn_session');
          localStorage.removeItem('cdn_token');
        }
        setTimeout(() => onLogin(), 1200);
      } else {
        setRegErr(error || 'Registration failed.');
      }
    } catch {
      setRegErr('Connection error. Please try again.');
    } finally {
      setRegLoad(false);
    }
  };

  return (
    <div className="lm-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="lm-panel" role="dialog" aria-modal="true" aria-label="CDN Portal">

        {/* Close */}
        <button className="lm-close" onClick={onClose} aria-label="Close">
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
              <p className="lm-dept">CDN E-Portal</p>
            </div>
          </div>
          <div className="lm-title-group">
            <span className="lm-eyebrow">Restricted Access</span>
            <h2 className="lm-title">{tab === 'login' ? 'Sign In' : 'Create Account'}</h2>
          </div>
        </div>

        {/* Tabs */}
        <div className="lm-tabs">
          <button
            className={`lm-tab${tab === 'login' ? ' lm-tab--active' : ''}`}
            onClick={() => switchTab('login')}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`lm-tab${tab === 'register' ? ' lm-tab--active' : ''}`}
            onClick={() => switchTab('register')}
            type="button"
          >
            Register
          </button>
        </div>

        {/* ── LOGIN FORM ── */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="lm-form" noValidate>
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
                  placeholder="Student number or admin username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  required
                />
              </div>
            </div>

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
                <button type="button" className="lm-pass-toggle" onClick={() => setShowPass(!showPass)} aria-label="Toggle password">
                  {showPass ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>
            </div>

            {loginErr && (
              <div className="lm-error" role="alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {loginErr}
              </div>
            )}

            <button type="submit" className={`lm-submit${loginLoad ? ' loading' : ''}`} disabled={loginLoad}>
              {loginLoad ? <span className="lm-spinner" /> : (
                <>Sign In <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
              )}
            </button>

            <p className="lm-switch-text">
              No account yet?{' '}
              <button type="button" className="lm-switch-btn" onClick={() => switchTab('register')}>
                Create one
              </button>
            </p>
          </form>
        )}

        {/* ── REGISTER FORM ── */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="lm-form" noValidate>

            {regSuccess ? (
              <div className="lm-success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
                Account created! Signing you in…
              </div>
            ) : (
              <>
                <div className="lm-field">
                  <label htmlFor="reg-sn" className="lm-label">Student Number</label>
                  <div className="lm-input-wrap">
                    <svg className="lm-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/>
                      <path d="M16 2v4M8 2v4M3 10h18"/>
                    </svg>
                    <input
                      id="reg-sn"
                      type="text"
                      className="lm-input"
                      placeholder="e.g. 2025-0617"
                      value={regSN}
                      onChange={(e) => setRegSN(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <div className="lm-field">
                  <label htmlFor="reg-pass" className="lm-label">Set Password</label>
                  <div className="lm-input-wrap">
                    <svg className="lm-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                    <input
                      id="reg-pass"
                      type={showReg ? 'text' : 'password'}
                      className="lm-input"
                      placeholder="At least 8 characters"
                      value={regPass}
                      onChange={(e) => setRegPass(e.target.value)}
                      required
                    />
                    <button type="button" className="lm-pass-toggle" onClick={() => setShowReg(!showReg)} aria-label="Toggle">
                      {showReg ? <EyeOff /> : <EyeOpen />}
                    </button>
                  </div>
                </div>

                {regPass && (() => {
                  const strength = getPasswordStrength(regPass);
                  return (
                    <div style={{marginTop: '-8px', marginBottom: '4px'}}>
                      <div style={{display: 'flex', gap: '4px', marginBottom: '4px'}}>
                        {[1, 2, 3, 4].map(i => (
                          <div
                            key={i}
                            style={{flex: 1,
                              height: '4px',
                              borderRadius: '2px',
                              backgroundColor: i <= strength.level ? strength.color : '#e5e7eb',
                              transition: 'background-color 0.2s',}}
                          />
                        ))}
                      </div>
                      <span style={{fontSize: '11px', color: strength.color, fontWeight: 500}}>
                        {strength.label}
                      </span>
                    </div>
                  );
                })()}

                <div className="lm-field">
                  <label htmlFor="reg-confirm" className="lm-label">Confirm Password</label>
                  <div className="lm-input-wrap">
                    <svg className="lm-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                    <input
                      id="reg-confirm"
                      type={showConf ? 'text' : 'password'}
                      className="lm-input"
                      placeholder="Re-enter password"
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      required
                    />
                    <button type="button" className="lm-pass-toggle" onClick={() => setShowConf(!showConf)} aria-label="Toggle">
                      {showConf ? <EyeOff /> : <EyeOpen />}
                    </button>
                  </div>
                </div>

                {regErr && (
                  <div className="lm-error" role="alert">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {regErr}
                  </div>
                )}

                <button type="submit" className={`lm-submit${regLoad ? ' loading' : ''}`} disabled={regLoad}>
                  {regLoad ? <span className="lm-spinner" /> : (
                    <>Create Account <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                  )}
                </button>

                <p className="lm-switch-text">
                  Already have an account?{' '}
                  <button type="button" className="lm-switch-btn" onClick={() => switchTab('login')}>
                    Sign in
                  </button>
                </p>
              </>
            )}
          </form>
        )}

        <p className="lm-footer-note">
          For access issues, contact the CDN administrator.
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
