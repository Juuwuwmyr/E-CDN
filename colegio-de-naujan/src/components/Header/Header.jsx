import { useState, useEffect } from 'react';
import cdnLogo from '../../assets/images/logo.png';
import bagongPilipinasLogo from '../../assets/images/bagong-pilipinas-seeklogo.png';

const Header = ({ isAuthenticated, onLoginClick, onLogout }) => {
  const [scrolled,   setScrolled]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [activeLink, setActiveLink] = useState('#home');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Home',     href: '#home'     },
    { label: 'Courses',  href: '#courses'  },
    { label: 'Services', href: '#services' },
    { label: 'About',    href: '#about'    },
    { label: 'Contact',  href: '#contact'  },
  ];

  const handleNav = (href) => { setActiveLink(href); setMenuOpen(false); };

  return (
    <>
      {/* Top bar */}
      <div style={{ background: '#002280' }} className="py-2">
        <div className="cdn-container flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.78)' }}>
              <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <circle cx="12" cy="11" r="3"/>
              </svg>
              Naujan, Oriental Mindoro
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.78)' }}>
              <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              cdn.college@edu.ph
            </span>
          </div>
          <span
            className="text-[0.7rem] font-bold px-2.5 py-0.5 rounded-full tracking-wide"
            style={{ color: '#FFD700', border: '1px solid rgba(255,215,0,0.4)' }}
          >
            S.Y. 2026 – 2027
          </span>
        </div>
      </div>

      {/* Main header */}
      <header
        className="sticky top-0 z-50 bg-white transition-shadow duration-300"
        style={{
          borderBottom: '3px solid #FFD700',
          boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        <div className="cdn-container flex items-center py-3" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}>

          {/* Logo — left */}
          <a href="#home" onClick={() => handleNav('#home')} className="flex items-center gap-3 shrink-0 group" style={{ textDecoration: 'none' }}>
            <img
              src={cdnLogo}
              alt="Colegio De Naujan"
              className="object-contain transition-transform duration-300 group-hover:scale-105"
              style={{ width: 50, height: 50 }}
            />
            <div className="flex flex-col">
              <span className="text-[1.05rem] font-extrabold leading-tight tracking-tight" style={{ color: '#002280' }}>
                Colegio De Naujan
              </span>
              <span className="text-[0.65rem] font-semibold uppercase tracking-widest" style={{ color: '#6b7280' }}>
                Official Website
              </span>
            </div>
          </a>

          {/* Desktop nav — centered */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((l) => {
              const isActive = activeLink === l.href;
              return (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => handleNav(l.href)}
                  className="relative px-3.5 py-2 text-[0.88rem] font-semibold transition-all duration-150"
                  style={{
                    color: isActive ? '#002280' : '#374151',
                    textDecoration: 'none',
                    background: 'transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#002280'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#374151'; }}
                >
                  {l.label}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: '50%',
                      transform: isActive ? 'translateX(-50%) scaleX(1)' : 'translateX(-50%) scaleX(0)',
                      transformOrigin: 'center',
                      width: '70%',
                      height: 2.5,
                      background: '#002280',
                      borderRadius: 2,
                      transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1)',
                      display: 'block',
                    }}
                  />
                </a>
              );
            })}
          </nav>

          {/* Right side — Bagong Pilipinas logo */}
          <div className="hidden lg:flex items-center gap-4 justify-end">
            <img
              src={bagongPilipinasLogo}
              alt="Bagong Pilipinas"
              style={{ width: 46, height: 46, objectFit: 'contain' }}
            />
          </div>

          {/* Hamburger — mobile only */}
          <div className="flex lg:hidden justify-end">
            <button
              className="flex flex-col gap-[5px] p-1.5 bg-transparent border-0 cursor-pointer"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span className="block w-[22px] h-[2px] rounded transition-all duration-300"
                    style={{ background: '#002280', transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none' }} />
              <span className="block w-[22px] h-[2px] rounded transition-all duration-300"
                    style={{ background: '#002280', opacity: menuOpen ? 0 : 1 }} />
              <span className="block w-[22px] h-[2px] rounded transition-all duration-300"
                    style={{ background: '#002280', transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
            </button>
          </div>

        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden bg-white px-6 pb-4 flex flex-col gap-1" style={{ borderTop: '3px solid #FFD700' }}>
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => handleNav(l.href)}
                className="py-3 text-[0.95rem] font-semibold border-b border-gray-100 last:border-0"
                style={{ color: activeLink === l.href ? '#002280' : '#374151', textDecoration: 'none' }}
              >
                {l.label}
              </a>
            ))}
          </div>
        )}
      </header>
    </>
  );
};

export default Header;
