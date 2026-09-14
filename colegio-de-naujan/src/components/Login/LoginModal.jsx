import { useState, useEffect } from 'react';
import './LoginModal.css';
import cdnLogo from '../../assets/images/logo.png';
import { recordLogin } from '../Dashboard/LoginAnalytics';

// Admin users
const ADMIN_USERS = [
  { username: 'admin', password: 'bsis2026', name: 'Administrator', role: 'Admin', department: 'Admin' },
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

const LoginModal = ({ onLogin, onClose }) => {
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

  
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

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
          name: adminMatch.name, 
          role: adminMatch.role,
          department: adminMatch.department
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
      };
      localStorage.setItem('cdn_user', JSON.stringify(userData));
      
      onLogin();
    }, 700);
  };

  return (
    <div className="lm-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="lm-panel" role="dialog" aria-modal="true" aria-label="Sign in to portal">

        
        <button className="lm-close" onClick={onClose} aria-label="Close login">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6"  y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        
        <div className="lm-header">
          <div className="lm-logo-row">
            <img src={cdnLogo} alt="CDN Logo" className="lm-logo" />
            <div>
              <p className="lm-school">Colegio De Naujan</p>
              <p className="lm-dept">Official Website</p>
            </div>
          </div>

          <div className="lm-title-group">
            <span className="lm-eyebrow">{showRegister ? 'New Student' : 'Restricted Access'}</span>
            <h2 className="lm-title">{showRegister ? 'Register' : 'Sign In'}</h2>
            <p className="lm-hint">
              {showRegister 
                ? 'Create your account to access the CDN portal and track your logins.'
                : 'Enter your CDN credentials to access the official website portal.'}
            </p>
          </div>
        </div>

        
        {!showRegister ? (
          <form onSubmit={handleSubmit} className="lm-form" noValidate>
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
                  placeholder="e.g. admin or student number"
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

            <button
              type="submit"
              className={`lm-submit${loading ? ' loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <span className="lm-spinner" />
              ) : (
                <>
                  Login
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>

            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 8px 0' }}>
                Don't have an account?
              </p>
              <button
                type="button"
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
          </form>
        ) : (
          <form onSubmit={handleRegister} className="lm-form" noValidate>
            <div className="lm-field">
              <label htmlFor="lm-fullname" className="lm-label">Full Name</label>
              <div className="lm-input-wrap">
                <svg className="lm-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <input
                  id="lm-fullname"
                  type="text"
                  className="lm-input"
                  placeholder="e.g. Juan Dela Cruz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="lm-field">
              <label htmlFor="lm-studentnumber" className="lm-label">Student Number</label>
              <div className="lm-input-wrap">
                <svg className="lm-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                <input
                  id="lm-studentnumber"
                  type="text"
                  className="lm-input"
                  placeholder="e.g. 2026001"
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="lm-field">
              <label htmlFor="lm-department" className="lm-label">Department</label>
              <div className="lm-input-wrap">
                <svg className="lm-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4v5a1 1 0 001 1h4a1 1 0 001-1V4"/>
                  <path d="M14 4v5a1 1 0 001 1h4a1 1 0 001-1V4"/>
                  <path d="M4 14v5a1 1 0 001 1h4a1 1 0 001-1v-5"/>
                  <path d="M14 14v5a1 1 0 001 1h4a1 1 0 001-1v-5"/>
                </svg>
                <select
                  id="lm-department"
                  className="lm-input"
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

            <div className="lm-field">
              <label htmlFor="lm-password" className="lm-label">Password</label>
              <div className="lm-input-wrap">
                <svg className="lm-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <input
                  id="lm-password"
                  type={showRegisterPass ? 'text' : 'password'}
                  className="lm-input"
                  placeholder="At least 6 characters"
                  value={registerPass}
                  onChange={(e) => setRegisterPass(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="lm-pass-toggle"
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

            <div className="lm-field">
              <label htmlFor="lm-confirmpass" className="lm-label">Confirm Password</label>
              <div className="lm-input-wrap">
                <svg className="lm-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <input
                  id="lm-confirmpass"
                  type="password"
                  className="lm-input"
                  placeholder="Confirm your password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  required
                />
              </div>
            </div>

            {registerError && (
              <div className="lm-error" role="alert">
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
              className={`lm-submit${registerLoading ? ' loading' : ''}`}
              disabled={registerLoading}
            >
              {registerLoading ? (
                <span className="lm-spinner" />
              ) : (
                <>
                  Create Account
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>

            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 8px 0' }}>
                Already have an account?
              </p>
              <button
                type="button"
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
          </form>
        )}

        <p className="lm-footer-note">
          {!showRegister 
            ? 'For account access, contact the CDN website administrator.'
            : 'Your registration will allow admins to track your logins in real-time analytics.'}
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
