import { useState } from 'react';
import useScrollAnimation from './hooks/useScrollAnimation';
import LoginModal  from './components/Login/LoginModal';
import Header      from './components/Header/Header';
import Hero        from './components/Hero/Hero';
import Courses     from './components/Courses/Courses';
import Services    from './components/Services/Services';
import About       from './components/About/About';
import MapSection  from './components/Map/MapSection';
import Footer      from './components/Footer/Footer';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin,       setShowLogin]       = useState(false);

  useScrollAnimation();

  const handleLogin  = () => { setIsAuthenticated(true);  setShowLogin(false); };
  const handleLogout = () => { setIsAuthenticated(false); };

  return (
    <div className="w-full min-h-screen flex flex-col">
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
        <Services />
        <About />
        <MapSection />
      </main>

      <Footer />
    </div>
  );
}

export default App;
