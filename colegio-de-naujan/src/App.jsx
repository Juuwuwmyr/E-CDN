import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useScrollAnimation from './hooks/useScrollAnimation';
import Header       from './components/Header/Header';
import Footer       from './components/Footer/Footer';
import LoginModal   from './components/Login/LoginModal';
import Dashboard        from './components/Dashboard/Dashboard';
import StudentDashboard from './components/Dashboard/StudentDashboard';
import HistoryPage      from './components/Dashboard/HistoryPage';
import AccountPage      from './components/Dashboard/AccountPage';
import ChatbotWidget    from './components/Chatbot/ChatbotWidget';
import { markSessionLogoutBeacon, renewSession, validateSession } from './lib/auth';

/* ── Helpers ── */
const isStudent = (user) =>
  user?.userType === 'student' || user?.role?.toLowerCase() === 'student';

/* ── Page components ── */
import { lazy, Suspense } from 'react';
const HomePage            = lazy(() => import('./components/Home/LandingPage'));
const GovernancePublicPage = lazy(() => import('./components/Governance/GovernancePublicPage'));

/* ── ScrollRedirect: navigates to "/" then scrolls to a section id ── */
function ScrollRedirect({ id }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/', { replace: true });
    const timer = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [id, navigate]);
  return null;
}

/* ── Helpers ── */
const readSession = () => {
  try {
    const raw = localStorage.getItem('cdn_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

/* Removes every persisted session artifact. */
const clearPersistedSession = () => {
  localStorage.removeItem('cdn_user');
  localStorage.removeItem('cdn_session');
  localStorage.removeItem('cdn_token');
};

function RequireAuth({ user, children }) {
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    // Update page title per route
    const titles = {
      '/':                  'Home — Colegio De Naujan',
      '/courses':           'Courses — Colegio De Naujan',
      '/services':          'Services — Colegio De Naujan',
      '/about':             'About — Colegio De Naujan',
      '/contact':           'Contact — Colegio De Naujan',
      '/dashboard':         'Dashboard — CDN E-Portal',
      '/dashboard/history': 'History — CDN E-Portal',
      '/dashboard/account': 'Account — CDN E-Portal',
      '/governance':        'OPEN Governance — CDN',
    };
    document.title = titles[pathname] ?? 'Colegio De Naujan';
  }, [pathname]);
  return null;
}

function PublicLayout({ onLoginClick, user }) {
  useScrollAnimation();
  return (
    <div className="w-full min-h-screen flex flex-col">
      <Header onLoginClick={onLoginClick} user={user} />
      <main style={{ paddingTop: '72px', flex: 1 }}>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/"          element={<HomePage />} />
            {/* Legacy routes — redirect to landing and scroll to section */}
            <Route path="/courses"  element={<ScrollRedirect id="courses" />} />
            <Route path="/services" element={<ScrollRedirect id="services" />} />
            <Route path="/about"    element={<ScrollRedirect id="about" />} />
            <Route path="/contact"  element={<ScrollRedirect id="contact" />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

/* ── Landing page: logged-in users go straight back to the portal ──
   Covers the back-button case (history → "/") so a logged-in user is
   never dumped on the public landing page as if they were logged out. */
function LandingRoute({ user, onLoginClick }) {
  if (user) return <Navigate to="/dashboard" replace />;
  return <PublicLayout onLoginClick={onLoginClick} user={user} />;
}

/* ── Inner app — needs router context ── */
function AppInner() {
  const [user,      setUser]      = useState(readSession);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const sessionId = localStorage.getItem('cdn_session');
    const token     = localStorage.getItem('cdn_token');

    // A session is only trusted when BOTH the DB row id and its
    // random token are present and match. Anything else (forged
    // cdn_user, stale pre-hardening sessions) is rejected.
    if (!sessionId || !token) {
      clearPersistedSession();
      setUser(null);
      return;
    }

    // Validate session is still active in DB (id + token + no logout)
    validateSession(sessionId, token).then(({ valid, session }) => {
      if (!valid) {
        // Session was invalidated server-side — force re-login
        clearPersistedSession();
        setUser(null);
        return;
      }
      // Refresh the cached user identity from the DB row so a
      // hand-edited localStorage can't elevate roles or names.
      const localUser = readSession();
      const refreshed = {
        ...(localUser || {}),
        username: session?.user_id ?? localUser?.username,
        role:     session?.role    ?? localUser?.role,
        userType: session?.user_type ?? localUser?.userType,
        name:     session?.full_name ?? localUser?.name,
      };
      localStorage.setItem('cdn_user', JSON.stringify(refreshed));
      setUser(refreshed);

      // Browser was reopened with a valid session — mark it active again
      renewSession(sessionId, token);
    });

    // When the tab/browser closes WITHOUT logout → auto-mark as logged out
    const handleUnload = () => markSessionLogoutBeacon(sessionId);
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  const handleLogin = () => {
    const userData = readSession();
    setUser(userData);
    setShowModal(false);
    navigate('/dashboard', { replace: true });
  };

  const handleLogout = () => {
    clearPersistedSession();
    setUser(null);
    // RequireAuth will redirect to / automatically when user is null
  };


  return (
    <>
      <ChatbotWidget />
      {showModal && (
        <LoginModal
          onLogin={handleLogin}
          onClose={() => setShowModal(false)}
        />
      )}
      <ScrollToTop />
      <Routes>
        <Route
          path="/"
          element={<LandingRoute user={user} onLoginClick={() => setShowModal(true)} />}
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth user={user}>
              {isStudent(user)
                ? <StudentDashboard user={user} onLogout={handleLogout} />
                : <Dashboard        user={user} onLogout={handleLogout} />
              }
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard/history"
          element={
            <RequireAuth user={user}>
              {isStudent(user)
                ? <StudentDashboard user={user} onLogout={handleLogout} />
                : <HistoryPage user={user} />
              }
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard/account"
          element={
            <RequireAuth user={user}>
              {isStudent(user)
                ? <StudentDashboard user={user} onLogout={handleLogout} />
                : <AccountPage user={user} onLogout={handleLogout} />
              }
            </RequireAuth>
          }
        />
        <Route
          path="/governance"
          element={
            <Suspense fallback={null}>
              <GovernancePublicPage />
            </Suspense>
          }
        />
        <Route
          path="/*"
          element={<PublicLayout onLoginClick={() => setShowModal(true)} user={user} />}
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
