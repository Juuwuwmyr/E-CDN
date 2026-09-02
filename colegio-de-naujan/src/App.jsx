import { useState } from 'react';
import useScrollAnimation from './hooks/useScrollAnimation';
import LoginModal from './components/Login/LoginModal';
import Header    from './components/Header/Header';
import Hero      from './components/Hero/Hero';
import Courses   from './components/Courses/Courses';
import Projects  from './components/Projects/Projects';
import About     from './components/About/About';
import Footer    from './components/Footer/Footer';
import './styles/App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin,       setShowLogin]       = useState(false);

  // Global scroll-reveal — watches .scroll-animate elements site-wide
  useScrollAnimation();

  const handleLogin = () => {
    setIsAuthenticated(true);
    setShowLogin(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <div className="App">
      {/* Login modal overlay — only shown when user clicks Login */}
      {showLogin && (
        <LoginModal
          onLogin={handleLogin}
          onClose={() => setShowLogin(false)}
        />
      )}

      <Header
        isAuthenticated={isAuthenticated}
        onLoginClick={() => setShowLogin(true)}
        onLogout={handleLogout}
      />

      <main>
        <Hero onLoginClick={() => setShowLogin(true)} />
        <Courses />
        <Projects
          isAuthenticated={isAuthenticated}
          onLoginClick={() => setShowLogin(true)}
        />
        <About />
      </main>

      <Footer />
    </div>
  );
}

export default App;
