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
import { markSessionLogoutBeacon, renewSession, recordLogoutSession } from './lib/auth';
import { logActivity } from './lib/activityLogger';
import useIdleTimeout from './hooks/useIdleTimeout';

/* ── Helpers ── */
const isStudent = (user) =>
  user?.userType === 'student' || user?.role?.toLowerCase() === 'student';

/* ── Page components ── */
import { lazy, Suspense } from 'react';
const HomePage    = lazy(() => import('./components/Home/LandingPage'));

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
    };
    document.title = titles[pathname] ?? 'Colegio De Naujan';
  }, [pathname]);
  return null;
}

function PublicLayout({ onLoginClick }) {
  useScrollAnimation();
  return (
    <div className="w-full min-h-screen flex flex-col">
      <Header onLoginClick={onLoginClick} />
      <main style={{ paddingTop: '72px', flex: 1 }}>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/"         element={<HomePage />} />
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

/* ── Inner app — needs router context ── */
function AppInner() {
  const [user,      setUser]      = useState(readSession);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const sessionId = localStorage.getItem('cdn_session');
    if (!sessionId) return;

    // Browser was reopened with an existing session — mark it active again
    renewSession(sessionId);

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
    localStorage.removeItem('cdn_user');
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
          path="/*"
          element={<PublicLayout onLoginClick={() => setShowModal(true)} />}
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
