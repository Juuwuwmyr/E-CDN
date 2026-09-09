import { Link } from 'react-router-dom';
import cdnLogo from '../../assets/images/logo.png';

const Footer = () => {
  const year = new Date().getFullYear();
  const quickLinks = [
    { label: 'Home',     to: '/'         },
    { label: 'Courses',  to: '/courses'  },
    { label: 'Services', to: '/services' },
    { label: 'About',    to: '/about'    },
    { label: 'Contact',  to: '/contact'  },
  ];
  const courseLinks = ['BSIS', 'BTVTED-WFT', 'BTVTED-CHS', 'BPA'];
  const contactInfo = [
    { label: 'Address',      value: 'Naujan, Oriental Mindoro, Philippines' },
    { label: 'Email',        value: 'cdn.college@edu.ph' },
    { label: 'Office Hours', value: 'Mon – Fri: 8:00 AM – 5:00 PM' },
    { label: 'Portal Admin', value: 'cdn.portal@edu.ph' },
  ];

  const linkStyle = { fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.15s' };

  return (
    <footer style={{ background: '#111827' }}>

      <div className="cdn-container py-10 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-8 lg:gap-12">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <img src={cdnLogo} alt="Colegio De Naujan Logo" style={{ width: 56, height: 56, objectFit: 'contain', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Colegio De Naujan</div>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 2 }}>College Department</div>
              </div>
            </div>
            <p style={{ fontSize: '0.845rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: 0, maxWidth: 300 }}>
              The official website of Colegio De Naujan, Santiago, Oriental Mindoro.
              Committed to quality education, community service, and developing
              future leaders through values-driven learning.
            </p>
            <div className="flex gap-2 flex-wrap">
              {['Facebook', 'Instagram', 'YouTube'].map((s) => (
                <a key={s} href="#"
                  style={{ padding: '0.35rem 0.875rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: 'rgba(255,255,255,0.65)', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#002280'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
                >{s}</a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'rgba(255,255,255,0.35)', marginBottom: '1.25rem' }}>Quick Links</p>
            <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
              {quickLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} style={linkStyle}
                    onMouseEnter={e => e.currentTarget.style.color = '#FFD700'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                  >{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Courses */}
          <div>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'rgba(255,255,255,0.35)', marginBottom: '1.25rem' }}>Courses</p>
            <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
              {courseLinks.map((c) => (
                <li key={c}>
                  <Link to="/courses" style={linkStyle}
                    onMouseEnter={e => e.currentTarget.style.color = '#FFD700'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                  >{c}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'rgba(255,255,255,0.35)', marginBottom: '1.25rem' }}>Contact</p>
            <ul className="list-none p-0 m-0 flex flex-col gap-3.5">
              {contactInfo.map((c, i) => (
                <li key={i} style={{ fontSize: '0.845rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                  <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>{c.label}</span>
                  {c.value}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="cdn-container py-6 flex flex-col sm:flex-row items-center sm:justify-between gap-3 text-center sm:text-left">
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            &copy; {year} Colegio De Naujan. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {['Privacy Policy', 'Terms of Use', 'Sitemap'].map((l) => (
              <a key={l} href="#"
                style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.75)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
              >{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
