import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useScrollAnimation from './hooks/useScrollAnimation';
import Header       from './components/Header/Header';
import Footer       from './components/Footer/Footer';
import LoginModal   from './components/Login/LoginModal';
import Dashboard    from './components/Dashboard/Dashboard';

/* ── Page components ── */
import { lazy, Suspense } from 'react';
const HomePage    = lazy(() => import('./components/Home/HomePage'));
const CoursesPage = lazy(() => import('./components/Courses/CoursesPage'));
const ServicesPage = lazy(() => import('./components/Services/ServicesPage'));
const AboutPage   = lazy(() => import('./components/About/AboutPage'));
const ContactPage = lazy(() => import('./components/Map/ContactPage'));

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
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function PublicLayout({ onLoginClick }) {
  useScrollAnimation();
  return (
    <div className="w-full min-h-screen flex flex-col">
      <Header onLoginClick={onLoginClick} />
      <ScrollToTop />
      <main style={{ paddingTop: '72px', flex: 1 }}>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/"         element={<HomePage />}    />
            <Route path="/courses"  element={<CoursesPage />} />
            <Route path="/services" element={<ServicesPage />}/>
            <Route path="/about"    element={<AboutPage />}   />
            <Route path="/contact"  element={<ContactPage />} />
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

  const handleLogin = () => {
    const userData = readSession();
    setUser(userData);
    setShowModal(false);
    navigate('/dashboard', { replace: true });
  };

  const handleLogout = () => {
    localStorage.removeItem('cdn_user');
    setUser(null);
    navigate('/', { replace: true });
  };

  return (
    <>
      {showModal && (
        <LoginModal
          onLogin={handleLogin}
          onClose={() => setShowModal(false)}
        />
      )}

      <Routes>
        <Route
          path="/dashboard"
          element={
            <RequireAuth user={user}>
              <Dashboard user={user} onLogout={handleLogout} />
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
