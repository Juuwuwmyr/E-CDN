import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import cdnLogo from '../../assets/images/logo.png';
import bagongPilipinasLogo from '../../assets/images/bagong-pilipinas-seeklogo.png';

const navLinks = [
  { label: 'Home',     to: '/'         },
  { label: 'Courses',  to: '/courses'  },
  { label: 'Services', to: '/services' },
  { label: 'About',    to: '/about'    },
  { label: 'Contact',  to: '/contact'  },
];

const serviceDropdown = [
  {
    label: 'CSC Services',
    sub: 'Fines Management System',
    url: 'https://student-fines-hub-vf9z.vercel.app/',
    color: '#002280',
  },
  {
    label: 'OSAS Services',
    sub: 'Violation Tracking System',
    url: 'https://osas-sys.duckdns.org/',
    color: '#C8102E',
  },
  {
    label: 'Admission Services',
    sub: 'Admissions Office',
    url: 'https://ecnesis.duckdns.org/',
    color: '#C8960C',
  },
];

const Header = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const [scrolled,         setScrolled]         = useState(false);
  const [menuOpen,         setMenuOpen]         = useState(false);
  const [servicesOpen,     setServicesOpen]     = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef(null);
  const leaveTimer  = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); setServicesOpen(false); }, [location.pathname]);

  const openDropdown  = () => { clearTimeout(leaveTimer.current); setServicesOpen(true); };
  const closeDropdown = () => { leaveTimer.current = setTimeout(() => setServicesOpen(false), 120); };

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
      <div className="cdn-container py-3 flex items-center justify-between lg:grid lg:grid-cols-[1fr_auto_1fr]">
        {/* Logo */}
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

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {navLinks.map((l) => {
            const isActive = location.pathname === l.to;
            const isServices = l.to === '/services';

            if (isServices) {
              return (
                <div
                  key={l.to}
                  ref={dropdownRef}
                  className="relative"
                  onMouseEnter={openDropdown}
                  onMouseLeave={closeDropdown}
                >
                  {/* Services trigger */}
                  <Link
                    to={l.to}
                    className="relative flex items-center gap-1 px-3.5 py-2 text-[0.88rem] font-semibold transition-all duration-150"
                    style={{ color: isActive ? '#002280' : '#374151', textDecoration: 'none' }}
                  >
                    {l.label}
                    {/* chevron */}
                    <svg
                      width="11" height="11" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                      style={{ transition: 'transform 0.2s', transform: servicesOpen ? 'rotate(180deg)' : 'rotate(0deg)', marginTop: 1 }}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                    <span style={{
                      position: 'absolute', bottom: 0, left: '50%',
                      transform: isActive ? 'translateX(-50%) scaleX(1)' : 'translateX(-50%) scaleX(0)',
                      transformOrigin: 'center', width: '70%', height: 2.5,
                      background: '#002280', borderRadius: 2, display: 'block',
                      transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1)',
                    }} />
                  </Link>

                  {/* Dropdown panel */}
                  {servicesOpen && (
                    <div
                      className="absolute top-full left-1/2 mt-2 flex flex-col overflow-hidden"
                      style={{
                        transform: 'translateX(-50%)',
                        minWidth: 240,
                        background: '#fff',
                        border: '1.5px solid #e5e7eb',
                        borderRadius: 12,
                        boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                        animation: 'dropIn 0.18s ease',
                      }}
                    >
                      {serviceDropdown.map((s, i) => (
                        <a
                          key={i}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-3 px-4 py-3 transition-all duration-150"
                          style={{ textDecoration: 'none', borderBottom: i < serviceDropdown.length - 1 ? '1px solid #f3f4f6' : 'none' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#f8f9ff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <span
                            style={{
                              width: 8, height: 8, borderRadius: '50%',
                              background: s.color, flexShrink: 0, marginTop: 5,
                            }}
                          />
                          <div className="flex flex-col">
                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F1422' }}>{s.label}</span>
                            <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 1 }}>{s.sub}</span>
                          </div>
                          {/* external icon */}
                          <svg
                            className="ml-auto shrink-0 mt-0.5"
                            width="12" height="12" viewBox="0 0 24 24" fill="none"
                            stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round"
                          >
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                            <polyline points="15 3 21 3 21 9"/>
                            <line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={l.to}
                to={l.to}
                className="relative px-3.5 py-2 text-[0.88rem] font-semibold transition-all duration-150"
                style={{ color: isActive ? '#002280' : '#374151', textDecoration: 'none' }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#002280'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#374151'; }}
              >
                {l.label}
                <span style={{
                  position: 'absolute', bottom: 0, left: '50%',
                  transform: isActive ? 'translateX(-50%) scaleX(1)' : 'translateX(-50%) scaleX(0)',
                  transformOrigin: 'center', width: '70%', height: 2.5,
                  background: '#002280', borderRadius: 2, display: 'block',
                  transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1)',
                }} />
              </Link>
            );
          })}
        </nav>

        {/* Right — Login + Bagong Pilipinas */}
        <div className="hidden lg:flex items-center gap-4 justify-end">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-1.5 px-4 py-2 font-bold text-[0.82rem] rounded-lg border-0 cursor-pointer transition-all duration-150"
            style={{ background: '#002280', color: '#fff' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#001560'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#002280'; e.currentTarget.style.transform = 'none'; }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Login
          </button>
          <img src={bagongPilipinasLogo} alt="Bagong Pilipinas" style={{ width: 46, height: 46, objectFit: 'contain' }} />
        </div>

        {/* Hamburger */}
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
            background: scrolled ? 'rgba(255,255,255,0.9)' : '#fff',
            backdropFilter: scrolled ? 'blur(16px)' : 'none',
            borderTop: '1px solid rgba(0,34,128,0.08)',
          }}
        >
          {navLinks.map((l) => {
            if (l.to === '/services') {
              return (
                <div key={l.to}>
                  <button
                    className="w-full flex items-center justify-between py-3 text-[0.95rem] font-semibold border-b border-gray-100 bg-transparent border-0 cursor-pointer"
                    style={{ color: '#374151' }}
                    onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                  >
                    Services
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      style={{ transition: 'transform 0.2s', transform: mobileServicesOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  {mobileServicesOpen && (
                    <div className="flex flex-col pl-4 pb-2" style={{ borderBottom: '1px solid #f3f4f6' }}>
                      {serviceDropdown.map((s, i) => (
                        <a
                          key={i}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 py-2.5"
                          style={{ textDecoration: 'none' }}
                          onClick={() => setMenuOpen(false)}
                        >
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>{s.label}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <Link
                key={l.to}
                to={l.to}
                className="py-3 text-[0.95rem] font-semibold border-b border-gray-100 last:border-0"
                style={{ color: location.pathname === l.to ? '#002280' : '#374151', textDecoration: 'none' }}
              >
                {l.label}
              </Link>
            );
          })}
          <button
            onClick={() => { setMenuOpen(false); navigate('/login'); }}
            className="mt-3 w-full py-2.5 font-bold text-sm rounded-lg border-0 cursor-pointer"
            style={{ background: '#002280', color: '#fff' }}
          >
            Login
          </button>
        </div>
      )}

      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0);    }
        }
      `}</style>
    </header>
  );
};

export default Header;
