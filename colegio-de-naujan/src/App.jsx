import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useScrollAnimation from './hooks/useScrollAnimation';
import Header      from './components/Header/Header';
import Footer      from './components/Footer/Footer';
import LoginModal  from './components/Login/LoginModal';
import HomePage    from './pages/HomePage';
import CoursesPage from './pages/CoursesPage';
import ServicesPage from './pages/ServicesPage';
import AboutPage   from './pages/AboutPage';
import ContactPage from './pages/ContactPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Layout({ onLoginClick }) {
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

function App() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <BrowserRouter>
      {showLogin && (
        <LoginModal
          onLogin={() => setShowLogin(false)}
          onClose={() => setShowLogin(false)}
        />
      )}
      <Layout onLoginClick={() => setShowLogin(true)} />
    </BrowserRouter>
  );
}

export default App;
