import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useScrollAnimation from './hooks/useScrollAnimation';
import Header      from './components/Header/Header';
import Footer      from './components/Footer/Footer';
import LoginModal  from './components/Login/LoginModal';
import LoginPage   from './pages/LoginPage';
import Dashboard   from './pages/Dashboard';
import HomePage    from './pages/HomePage';
import CoursesPage from './pages/CoursesPage';
import ServicesPage from './pages/ServicesPage';
import AboutPage   from './pages/AboutPage';
import ContactPage from './pages/ContactPage';

/* ── Helper: read persisted session ── */
const readSession = () => {
  try {
    const raw = localStorage.getItem('cdn_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/* ── Guard: redirect to /login if not authenticated ── */
function RequireAuth({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/* ── Pages that use the public Header + Footer layout ── */
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
        <Routes>
          <Route path="/"         element={<HomePage />}    />
          <Route path="/courses"  element={<CoursesPage />} />
          <Route path="/services" element={<ServicesPage />}/>
          <Route path="/about"    element={<AboutPage />}   />
          <Route path="/contact"  element={<ContactPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

/* ══ Root App ══ */
function App() {
  const [user,      setUser]      = useState(readSession);
  const [showModal, setShowModal] = useState(false);

  const handleLogin  = (userData) => setUser(userData);
  const handleLogout = () => {
    localStorage.removeItem('cdn_user');
    setUser(null);
  };

  return (
    <BrowserRouter>
      {/* Legacy modal kept for the Login button in the public header */}
      {showModal && (
        <LoginModal
          onLogin={() => { setUser(readSession()); setShowModal(false); }}
          onClose={() => setShowModal(false)}
        />
      )}

      <Routes>
        {/* ── Full-page login ── */}
        <Route
          path="/login"
          element={<LoginPage onLogin={handleLogin} />}
        />

        {/* ── Protected dashboard ── */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth user={user}>
              <Dashboard user={user} onLogout={handleLogout} />
            </RequireAuth>
          }
        />

        {/* ── Public website (header + footer) ── */}
        <Route
          path="/*"
          element={<PublicLayout onLoginClick={() => setShowModal(true)} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
