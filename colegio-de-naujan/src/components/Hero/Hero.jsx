import { Link } from 'react-router-dom';
import bgImg from '../../assets/images/background.jpg';

const Hero = () => {
  return (
    <section
      id="home"
      className="relative overflow-hidden flex items-center justify-center"
      style={{ minHeight: 'calc(100vh - 72px)' }}
    >
      {/* Background photo — full cover */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImg})` }}
      />

      {/* Dark navy overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: 'rgba(15, 25, 80, 0.78)' }}
      />

      {/* Subtle dot grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Content — centered */}
      <div className="cdn-container relative z-10 flex flex-col items-center text-center gap-7 py-24">

        {/* Eyebrow pill */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[0.7rem] font-bold uppercase tracking-[2px]"
          style={{
            background: 'rgba(255,255,255,0.09)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: 'rgba(255,255,255,0.72)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#C8960C' }} />
          Colegio De Naujan — Official Website
        </div>

        {/* Heading */}
        <h1
          className="font-black m-0"
          style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', lineHeight: 1.1, letterSpacing: '-1px' }}
        >
          <span style={{ color: '#ffffff' }}>Excellence in</span>
          <br />
          <span style={{ color: '#C8960C' }}>Higher Education</span>
        </h1>

        {/* Subtext */}
        <p
          className="m-0"
          style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.68)', lineHeight: 1.85, maxWidth: 540 }}
        >
          Shaping future leaders through innovative academic programs,
          experienced faculty, and state-of-the-art facilities in
          Santiago, Oriental Mindoro.
        </p>

        {/* Buttons */}
        <div className="flex gap-4 flex-wrap justify-center mt-1">

          {/* Explore Courses — shimmer button */}
          <Link
            to="/courses"
            className="inline-flex items-center px-8 py-3 font-bold text-sm rounded cursor-pointer transition-all duration-200"
            style={{
              background: '#C8960C',
              color: '#0F1422',
              textDecoration: 'none',
              letterSpacing: '0.6px',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
          >
            <span style={{ position: 'relative', zIndex: 1 }}>EXPLORE COURSES</span>
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0,
                left: '-75%',
                width: '50%',
                height: '100%',
                background: 'linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)',
                transform: 'skewX(-15deg)',
                animation: 'shimmer 2.2s ease-in-out infinite',
              }}
            />
          </Link>

          {/* Learn More — ghost */}
          <Link
            to="/about"
            className="inline-flex items-center px-8 py-3 font-bold text-sm rounded cursor-pointer transition-all duration-200"
            style={{
              background: 'transparent',
              color: '#ffffff',
              textDecoration: 'none',
              border: '2px solid rgba(255,255,255,0.45)',
              letterSpacing: '0.6px',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)'; e.currentTarget.style.transform = 'none'; }}
          >
            LEARN MORE
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="mt-10">
          <div
            style={{
              width: 24,
              height: 38,
              border: '2px solid rgba(255,255,255,0.28)',
              borderRadius: 12,
              display: 'flex',
              justifyContent: 'center',
              paddingTop: 6,
              margin: '0 auto',
            }}
          >
            <div
              style={{
                width: 4,
                height: 8,
                background: 'rgba(255,255,255,0.45)',
                borderRadius: 2,
                animation: 'scrollDot 1.8s ease-in-out infinite',
              }}
            />
          </div>
        </div>

      </div>

      <style>{`
        @keyframes shimmer {
          0%   { left: -75%; }
          100% { left: 125%; }
        }
        @keyframes scrollDot {
          0%, 100% { transform: translateY(0);   opacity: 1;   }
          50%       { transform: translateY(8px); opacity: 0.3; }
        }
      `}</style>
    </section>
  );
};

export default Hero;
