import ParticleCanvas from './ParticleCanvas';
import bgImg from '../../assets/images/background.jpg';

const Hero = ({ onLoginClick }) => {
  const stats = [
    { value: '__',  label: 'Years of Service'  },
    { value: '__',  label: 'College Courses'    },
    { value: '__',  label: 'Students Enrolled'  },
    { value: '__',  label: 'Passing Rate'       },
  ];

  return (
    <section
      id="home"
      className="relative overflow-hidden flex items-center"
      style={{ background: '#f4f6fb', minHeight: 'calc(100vh - 88px)' }}
    >
      {/* dot grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(0,34,128,0.045) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* bg photo */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-top bg-no-repeat pointer-events-none z-0"
        style={{ backgroundImage: `url(${bgImg})`, opacity: 0.06, filter: 'grayscale(1)' }}
      />

      <ParticleCanvas />

      <div className="cdn-container relative z-10 w-full grid lg:grid-cols-2 items-center gap-14 py-20">

        {/* LEFT */}
        <div className="flex flex-col gap-6 scroll-animate from-left is-visible"
             style={{ transitionDelay: '0.1s' }}>

          {/* Eyebrow */}
          <div
            className="inline-flex items-center gap-2 w-fit px-3.5 py-1.5 rounded text-[0.68rem] font-extrabold uppercase tracking-[2px]"
            style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#6b7280', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#C8102E', animation: 'pulse 2s infinite' }} />
            Colegio De Naujan — Official Website
          </div>

          {/* Heading */}
          <h1 className="font-black m-0" style={{ fontSize: 'clamp(2.2rem,4.5vw,3.4rem)', lineHeight: 1.08, letterSpacing: '-1.5px', color: '#0F1422' }}>
            Excellence in<br />
            <span style={{ color: '#002280' }}>Education</span>{' '}
            <span style={{ color: '#C8102E' }}>
              &amp; Service.
            </span>
          </h1>

          {/* Body */}
          <p className="text-[1rem] m-0" style={{ color: '#4E5873', lineHeight: 1.8, maxWidth: 460 }}>
            Colegio De Naujan is a premier institution in Santiago, Oriental Mindoro —
            committed to quality education, community service, and developing future
            leaders through values-driven learning.
          </p>

          {/* Actions */}
          <div className="flex gap-3.5 flex-wrap">
            <a href="#courses" className="btn-primary">Explore Courses</a>
            <a href="#about"   className="btn-ghost">Learn More</a>
          </div>

          {/* Stats */}
          <div className="flex pt-6 mt-1" style={{ borderTop: '1px dashed #d1d5db' }}>
            {stats.map((s, i) => (
              <div
                key={i}
                className="flex flex-col gap-0.5"
                style={{
                  paddingRight: i < stats.length - 1 ? '1.75rem' : 0,
                  marginRight:  i < stats.length - 1 ? '1.75rem' : 0,
                  borderRight:  i < stats.length - 1 ? '1px solid #e5e7eb' : 'none',
                }}
              >
                <span className="font-black leading-none" style={{ fontSize: '1.7rem', color: '#002280', letterSpacing: '-0.5px' }}>{s.value}</span>
                <span className="font-semibold uppercase" style={{ fontSize: '0.68rem', color: '#6b7280', letterSpacing: '0.75px' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="relative flex justify-end scroll-animate from-right is-visible"
             style={{ transitionDelay: '0.25s' }}>
          <div
            className="absolute rounded-full pointer-events-none"
            style={{ top: '-2rem', right: '-2rem', width: 256, height: 256, background: 'radial-gradient(circle, rgba(200,16,46,0.1) 0%, transparent 70%)' }}
          />

          <div className="relative w-full" style={{ maxWidth: 490 }}>
            {/* Main image */}
            <div
              className="overflow-hidden relative"
              style={{
                borderRadius: 14,
                boxShadow: '0 20px 60px rgba(0,34,128,0.14)',
                background: '#002280',
                transform: 'rotate(-0.8deg)',
                transition: 'transform 0.4s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'rotate(0deg)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'rotate(-0.8deg)'}
            >
              <img
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=900&q=85"
                alt="Students at Colegio De Naujan"
                className="w-full block"
                style={{ aspectRatio: '16/11', objectFit: 'cover', animation: 'heroFloat 7s ease-in-out infinite' }}
              />
              {/* browser bar */}
              <div className="absolute top-0 left-0 right-0 flex items-center gap-2 px-4 py-2" style={{ background: 'rgba(8,12,30,0.88)' }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#4ade80' }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#facc15' }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f87171' }} />
                <span className="ml-1 font-mono" style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.3px' }}>
                  cdn-official-website
                </span>
              </div>
            </div>

            {/* Float card top */}
            <div
              className="absolute flex flex-col gap-0.5"
              style={{
                top: '3rem', left: '-2.5rem',
                background: '#fff', borderRadius: 14, padding: '0.875rem 1.125rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                minWidth: 190, borderLeft: '3px solid #002280',
                transform: 'rotate(1.5deg)',
              }}
            >
              <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#C8102E', textTransform: 'uppercase', letterSpacing: '1px' }}>DepEd Recognized</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F1422', lineHeight: 1.3 }}>School of Excellence</span>
              <span style={{ fontSize: '0.68rem', color: '#6b7280', fontWeight: 600 }}>Santiago, Oriental Mindoro</span>
            </div>

            {/* Float card bottom */}
            <div
              className="absolute flex flex-col gap-0.5"
              style={{
                bottom: '1.5rem', right: '-1.75rem',
                background: '#fff', borderRadius: 14, padding: '0.875rem 1.125rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                minWidth: 190, borderLeft: '3px solid #FFD700',
                transform: 'rotate(-1deg)',
              }}
            >
              <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#002280', lineHeight: 1 }}>4 Programs</span>
              <span style={{ fontSize: '0.68rem', color: '#6b7280', fontWeight: 600, lineHeight: 1.5 }}>
                BSIS · BTVTED-WFT<br />BTVTED-CHS · BPA
              </span>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
      `}</style>
    </section>
  );
};

export default Hero;
