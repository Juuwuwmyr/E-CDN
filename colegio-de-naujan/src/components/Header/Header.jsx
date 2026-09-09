import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import cdnLogo from '../../assets/images/logo.png';
import bagongPilipinasLogo from '../../assets/images/bagong-pilipinas-seeklogo.png';

const Header = () => {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const navLinks = [
    { label: 'Home',     to: '/'         },
    { label: 'Courses',  to: '/courses'  },
    { label: 'Services', to: '/services' },
    { label: 'About',    to: '/about'    },
    { label: 'Contact',  to: '/contact'  },
  ];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(255,255,255,0.55)' : '#ffffff',
        backdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.3)' : '1.5px solid #FFD700',
        boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <div
        className="cdn-container py-3"
        style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}
      >

        {/* Logo — left */}
        <Link to="/" className="flex items-center gap-3 shrink-0 group" style={{ textDecoration: 'none' }}>
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
        </Link>

        {/* Desktop nav — centered */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {navLinks.map((l) => {
            const isActive = location.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
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
              </Link>
            );
          })}
        </nav>

        {/* Right — Bagong Pilipinas logo */}
        <div className="hidden lg:flex items-center justify-end">
          <img
            src={bagongPilipinasLogo}
            alt="Bagong Pilipinas"
            style={{ width: 46, height: 46, objectFit: 'contain' }}
          />
        </div>

        {/* Hamburger — mobile */}
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
        <div
          className="lg:hidden px-6 pb-4 flex flex-col gap-1"
          style={{
            background: scrolled ? 'rgba(255,255,255,0.85)' : '#fff',
            backdropFilter: scrolled ? 'blur(16px)' : 'none',
            borderTop: '1px solid rgba(0,34,128,0.08)',
          }}
        >
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="py-3 text-[0.95rem] font-semibold border-b border-gray-100 last:border-0"
              style={{
                color: location.pathname === l.to ? '#002280' : '#374151',
                textDecoration: 'none',
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

export default Header;
