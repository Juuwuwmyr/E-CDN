import { useState, useEffect } from 'react';
import '../../styles/Header.css';
import cdnLogo from '../../assets/images/logo.png';

const Header = ({ isAuthenticated, onLoginClick, onLogout }) => {
  const [scrolled,   setScrolled]  = useState(false);
  const [menuOpen,   setMenuOpen]  = useState(false);
  const [activeLink, setActiveLink] = useState('#home');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Home',     href: '#home'     },
    { label: 'Courses',  href: '#courses'  },
    { label: 'Projects', href: '#projects' },
    { label: 'About',    href: '#about'    },
    { label: 'Contact',  href: '#contact'  },
  ];

  const handleNav = (href) => {
    setActiveLink(href);
    setMenuOpen(false);
  };

  return (
    <>
      
      <div className="topbar">
        <div className="container topbar-inner">
          <div className="topbar-left">
            <span className="topbar-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <circle cx="12" cy="11" r="3"/>
              </svg>
              Naujan, Oriental Mindoro
            </span>
            <span className="topbar-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              cdn.college@edu.ph
            </span>
          </div>
          <div className="topbar-right">
            <span className="topbar-badge">S.Y. 2026 – 2027</span>
            {isAuthenticated && (
              <button className="topbar-logout" onClick={onLogout} title="Sign out">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>

      
      <header className={`header${scrolled ? ' scrolled' : ''}`}>
        <div className="container header-inner">

          
          <a href="#home" className="logo" onClick={() => handleNav('#home')}>
            <img src={cdnLogo} alt="Colegio De Naujan Logo" className="logo-img" />
            <div className="logo-text">
              <span className="logo-name">Colegio De Naujan</span>
              <span className="logo-dept">BSIS Project Portal</span>
            </div>
          </a>

          
          <nav className={`nav${menuOpen ? ' open' : ''}`} role="navigation" aria-label="Main navigation">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`nav-link${activeLink === l.href ? ' active' : ''}`}
                onClick={() => handleNav(l.href)}
              >
                {l.label}
              </a>
            ))}

            
            {isAuthenticated ? (
              <button className="nav-logout" onClick={onLogout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign Out
              </button>
            ) : (
              <button className="nav-login" onClick={() => { onLoginClick(); setMenuOpen(false); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Login
              </button>
            )}
          </nav>

          
          <button
            className={`hamburger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>
    </>
  );
};

export default Header;
