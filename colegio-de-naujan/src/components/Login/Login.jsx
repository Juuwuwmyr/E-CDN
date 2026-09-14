import { useState } from 'react';
import './Login.css';
import cdnLogo from '../../assets/images/logo.png';
import { recordLogin } from '../Dashboard/LoginAnalytics';

// Admin users
const ADMIN_USERS = [
  { username: 'admin', password: 'bsis2026', department: 'Admin', role: 'Administrator' },
];

const DEPARTMENTS = ['BSIS', 'BTVTED-WFT', 'BTVTED-CHS', 'BPA'];

// Get registered users from localStorage
const getRegisteredUsers = () => {
  try {
    return JSON.parse(localStorage.getItem('cdn_registered_users')) || {};
  } catch {
    return {};
  }
};

// Save registered users
const saveRegisteredUsers = (users) => {
  localStorage.setItem('cdn_registered_users', JSON.stringify(users));
};

const Login = ({ onLogin }) => {
  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  
  // Register form state
  const [showRegister, setShowRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [department, setDepartment] = useState('BSIS');
  const [registerPass, setRegisterPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showRegisterPass, setShowRegisterPass] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      // Check admin users
      const adminMatch = ADMIN_USERS.find(
        (u) => u.username === username.trim() && u.password === password
      );
      
      if (adminMatch) {
        // Admin login
        recordLogin(adminMatch.department, adminMatch.username);
        const userData = {
          username: adminMatch.username,
          name: adminMatch.role,
          role: adminMatch.role,
          department: adminMatch.department,
          loginTime: new Date().toISOString(),
        };
        localStorage.setItem('cdn_user', JSON.stringify(userData));
        onLogin();
      } else {
        // Check registered students
        const registeredUsers = getRegisteredUsers();
        const studentMatch = registeredUsers[username.trim()];
        
        if (studentMatch && studentMatch.password === password) {
          // Student login
          recordLogin(studentMatch.department, studentMatch.fullName);
          const userData = {
            username: studentMatch.username,
            name: studentMatch.fullName,
            role: 'Student',
            department: studentMatch.department,
            studentNumber: studentMatch.studentNumber,
            loginTime: new Date().toISOString(),
          };
          localStorage.setItem('cdn_user', JSON.stringify(userData));
          onLogin();
        } else {
          setError('Invalid username or password.');
          setLoading(false);
        }
      }
    }, 700);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setRegisterError('');
    
    // Validation
    if (!fullName.trim()) {
      setRegisterError('Full name is required.');
      return;
    }
    if (!studentNumber.trim()) {
      setRegisterError('Student number is required.');
      return;
    }
    if (studentNumber.trim().length < 4) {
      setRegisterError('Student number must be at least 4 characters.');
      return;
    }
    if (!registerPass) {
      setRegisterError('Password is required.');
      return;
    }
    if (registerPass.length < 6) {
      setRegisterError('Password must be at least 6 characters.');
      return;
    }
    if (registerPass !== confirmPass) {
      setRegisterError('Passwords do not match.');
      return;
    }

    setRegisterLoading(true);

    setTimeout(() => {
      const registeredUsers = getRegisteredUsers();
      
      // Check if username already exists
      if (registeredUsers[studentNumber.trim()]) {
        setRegisterError('Student number already registered.');
        setRegisterLoading(false);
        return;
      }

      // Register new student
      registeredUsers[studentNumber.trim()] = {
        username: studentNumber.trim(),
        fullName: fullName.trim(),
        studentNumber: studentNumber.trim(),
        department: department,
        password: registerPass,
      };

      saveRegisteredUsers(registeredUsers);
      
      // Auto-login after registration
      recordLogin(department, fullName.trim());
      const userData = {
        username: studentNumber.trim(),
        name: fullName.trim(),
        role: 'Student',
        department: department,
        studentNumber: studentNumber.trim(),
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem('cdn_user', JSON.stringify(userData));
      
      onLogin();
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
          {!showRegister ? (
            <>
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
                      placeholder="e.g. admin or student number"
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
                      Login
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 8px 0' }}>
                  Don't have an account?
                </p>
                <button
                  onClick={() => {
                    setShowRegister(true);
                    setError('');
                    setUsername('');
                    setPassword('');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#002280',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: '0',
                  }}
                >
                  Create an Account
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="login-form-heading-group">
                <span className="login-form-eyebrow">New Student</span>
                <h2 className="login-form-heading">Register</h2>
                <p className="login-form-hint">
                  Create your account to access the CDN portal and track your logins.
                </p>
              </div>

              <form onSubmit={handleRegister} className="login-form" noValidate>
                <div className="login-field">
                  <label htmlFor="register-fullname" className="login-label">
                    Full Name
                  </label>
                  <div className="login-input-wrap">
                    <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <input
                      id="register-fullname"
                      type="text"
                      className="login-input"
                      placeholder="e.g. Juan Dela Cruz"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label htmlFor="register-studentnumber" className="login-label">
                    Student Number
                  </label>
                  <div className="login-input-wrap">
                    <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/>
                      <path d="M16 2v4M8 2v4M3 10h18"/>
                    </svg>
                    <input
                      id="register-studentnumber"
                      type="text"
                      className="login-input"
                      placeholder="e.g. 2026001"
                      value={studentNumber}
                      onChange={(e) => setStudentNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label htmlFor="register-department" className="login-label">
                    Department
                  </label>
                  <div className="login-input-wrap">
                    <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4v5a1 1 0 001 1h4a1 1 0 001-1V4"/>
                      <path d="M14 4v5a1 1 0 001 1h4a1 1 0 001-1V4"/>
                      <path d="M4 14v5a1 1 0 001 1h4a1 1 0 001-1v-5"/>
                      <path d="M14 14v5a1 1 0 001 1h4a1 1 0 001-1v-5"/>
                    </svg>
                    <select
                      id="register-department"
                      className="login-input"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      style={{ cursor: 'pointer' }}
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="login-field">
                  <label htmlFor="register-password" className="login-label">
                    Password
                  </label>
                  <div className="login-input-wrap">
                    <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                    <input
                      id="register-password"
                      type={showRegisterPass ? 'text' : 'password'}
                      className="login-input"
                      placeholder="At least 6 characters"
                      value={registerPass}
                      onChange={(e) => setRegisterPass(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="login-pass-toggle"
                      onClick={() => setShowRegisterPass(!showRegisterPass)}
                      aria-label="Toggle password visibility"
                    >
                      {showRegisterPass ? (
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

                <div className="login-field">
                  <label htmlFor="register-confirmpass" className="login-label">
                    Confirm Password
                  </label>
                  <div className="login-input-wrap">
                    <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                    <input
                      id="register-confirmpass"
                      type="password"
                      className="login-input"
                      placeholder="Confirm your password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {registerError && (
                  <div className="login-error" role="alert">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {registerError}
                  </div>
                )}

                <button
                  type="submit"
                  className={`login-submit${registerLoading ? ' loading' : ''}`}
                  disabled={registerLoading}
                >
                  {registerLoading ? (
                    <span className="login-spinner" />
                  ) : (
                    <>
                      Create Account
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 8px 0' }}>
                  Already have an account?
                </p>
                <button
                  onClick={() => {
                    setShowRegister(false);
                    setRegisterError('');
                    setFullName('');
                    setStudentNumber('');
                    setRegisterPass('');
                    setConfirmPass('');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#002280',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: '0',
                  }}
                >
                  Sign In Instead
                </button>
              </div>
            </>
          )}

          <p className="login-form-footer-note">
            {!showRegister 
              ? 'For account access, contact the BSIS department coordinator.'
              : 'Your registration will allow admins to track your logins in real-time analytics.'}
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
