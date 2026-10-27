import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import bgImg from '../../assets/images/background.jpg';

const Hero = () => {
  const [muted,   setMuted]   = useState(true);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section
      id="home"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: 'calc(100vh - 72px)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Background image with parallax */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `url(${bgImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: `scale(1.08) translateY(${scrollY * 0.3}px)`,
          transition: 'transform 0.05s linear',
        }}
      />

      {/* Dark navy overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(160deg, rgba(5,10,35,0.78) 0%, rgba(0,22,80,0.72) 60%, rgba(5,10,35,0.65) 100%)',
        }}
      />

      {/* Gold top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 4, background: '#C8960C', zIndex: 10,
      }} />

      {/* Main content — centered */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: '5rem 1.5rem 8rem',
        maxWidth: 760, margin: '0 auto', width: '100%',
      }}>

        {/* Eyebrow badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 999, padding: '6px 18px',
          marginBottom: '1.75rem',
          backdropFilter: 'blur(8px)',
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#4ade80', display: 'inline-block',
            animation: 'heroPulse 2s ease-in-out infinite',
          }} />
          <span style={{
            fontSize: '.68rem', fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '2px',
            color: 'rgba(255,255,255,0.75)',
          }}>
            Colegio De Naujan — Official Portal
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          margin: '0 0 1.25rem',
          fontSize: 'clamp(2.4rem, 6vw, 4rem)',
          fontWeight: 900,
          lineHeight: 1.1,
          letterSpacing: '-1.5px',
          color: '#fff',
        }}>
          Excellence in<br />
          <span style={{ color: '#C8960C' }}>Higher Education</span>
        </h1>

        {/* Subtitle */}
        <p style={{
          margin: '0 0 2.5rem',
          fontSize: 'clamp(.9rem, 2vw, 1.05rem)',
          color: 'rgba(255,255,255,0.72)',
          lineHeight: 1.7,
          maxWidth: 520,
        }}>
          Shaping future leaders through innovative academic programs,
          experienced faculty, and state-of-the-art facilities.
        </p>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link
            to="/courses"
            style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '13px 28px', borderRadius: 8, border: 'none',
              background: '#C8960C', color: '#fff',
              fontWeight: 800, fontSize: '.9rem',
              textTransform: 'uppercase', letterSpacing: '1px',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(200,150,12,.45)',
              transition: 'transform .15s, box-shadow .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 28px rgba(200,150,12,.55)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 4px 20px rgba(200,150,12,.45)'; }}
          >
            Start Your Journey
          </Link>
          <Link
            to="/about"
            style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '12px 28px', borderRadius: 8,
              border: '2px solid rgba(255,255,255,0.65)',
              background: 'transparent', color: '#fff',
              fontWeight: 700, fontSize: '.9rem',
              textTransform: 'uppercase', letterSpacing: '1px',
              textDecoration: 'none',
              transition: 'background .15s, border-color .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor='#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(255,255,255,0.65)'; }}
          >
            Learn More
          </Link>
        </div>
      </div>

      {/* Large faint watermark bottom-right */}
      <div style={{
        position: 'absolute', bottom: 56, right: 0, zIndex: 2,
        padding: '0 1.5rem',
        pointerEvents: 'none',
      }}>
        <p style={{
          margin: 0,
          fontSize: 'clamp(1.8rem, 5vw, 3.2rem)',
          fontWeight: 900,
          color: 'rgba(255,255,255,0.07)',
          textTransform: 'uppercase',
          letterSpacing: '3px',
          lineHeight: 1,
          userSelect: 'none',
        }}>
          MEETS OPPORTUNITY
        </p>
      </div>

      {/* Mute button */}
      <button
        onClick={() => setMuted(m => !m)}
        aria-label={muted ? 'Unmute' : 'Mute'}
        style={{
          position: 'absolute', bottom: '1.5rem', right: '1.5rem',
          zIndex: 10,
          width: 38, height: 38, borderRadius: '50%',
          border: '1.5px solid rgba(255,255,255,0.35)',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(6px)',
          color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background .15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.2)'}
        onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}
      >
        {muted ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>
          </svg>
        )}
      </button>

      {/* Stats bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        zIndex: 3,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        justifyContent: 'center',
        padding: '0.9rem 2rem',
        gap: '3rem',
        flexWrap: 'wrap',
      }}>
        {[
          { value: '50+',  label: 'Years of Service'  },
          { value: '4',    label: 'College Programs'  },
          { value: '500+', label: 'Students Enrolled' },
          { value: '98%',  label: 'Passing Rate'      },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#C8960C', lineHeight: 1 }}>{s.value}</span>
            <span style={{ fontSize: '.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes heroPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.4; transform:scale(.7); }
        }
      `}</style>
    </section>
  );
};

export default Hero;
