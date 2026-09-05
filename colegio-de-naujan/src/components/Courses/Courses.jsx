import wftBg from '../../assets/images/background.jpg';

const colorBorder = { blue: '#002280', red: '#C8102E', gold: '#C8960C' };
const colorPill   = {
  blue: { bg: 'rgba(0,34,128,0.08)',  color: '#002280' },
  red:  { bg: 'rgba(200,16,46,0.08)', color: '#C8102E' },
  gold: { bg: 'rgba(200,150,12,0.1)', color: '#C8960C' },
};

const icons = {
  bsis: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <path d="M8 21h8M12 17v4"/>
      <path d="M7 8h.01M10 8h4"/>
      <rect x="6" y="11" width="12" height="3" rx="1"/>
    </svg>
  ),
  wft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8 2 6 6 6 8c0 2 1 3.5 2 4.5S10 14 10 16H14c0-2 1-3 2-4s2-2.5 2-4.5C18 6 16 2 12 2z"/>
      <path d="M10 21h4"/>
      <path d="M11 16v5"/>
      <path d="M13 16v5"/>
      <path d="M9 12c0 0 1.5 1 3 1s3-1 3-1"/>
    </svg>
  ),
  chs: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <rect x="9" y="9" width="6" height="6"/>
      <line x1="9"  y1="1"  x2="9"  y2="4"/>
      <line x1="15" y1="1"  x2="15" y2="4"/>
      <line x1="9"  y1="20" x2="9"  y2="23"/>
      <line x1="15" y1="20" x2="15" y2="23"/>
      <line x1="20" y1="9"  x2="23" y2="9"/>
      <line x1="20" y1="14" x2="23" y2="14"/>
      <line x1="1"  y1="9"  x2="4"  y2="9"/>
      <line x1="1"  y1="14" x2="4"  y2="14"/>
    </svg>
  ),
  bpa: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
};

const Courses = () => {
  const courses = [
    {
      code: 'BSIS', color: 'gold', bg: null, icon: icons.bsis,
      full: 'Bachelor of Science in Information Systems',
      desc: 'Focuses on the design, development, and management of information systems. Students build web apps, databases, and enterprise solutions that address real institutional needs.',
    },
    {
      code: 'BTVTED-WFT', color: 'gold', bg: null, icon: icons.wft,
      full: 'Bachelor of Technical-Vocational Teacher Education — Welding and Fabrication Technology',
      desc: 'Covers welding techniques, metal fabrication, and technical-vocational education. Projects include digital job order systems, materials tracking, and fabrication workflow management tools.',
    },
    {
      code: 'BTVTED-CHS', color: 'gold', bg: null, icon: icons.chs,
      full: 'Bachelor of Technical-Vocational Teacher Education — Computer Hardware Servicing',
      desc: 'Covers computer hardware servicing and technical-vocational education. Student projects include diagnostic tools, hardware inventory systems, and service management portals.',
    },
    {
      code: 'BPA', color: 'gold', bg: wftBg, icon: icons.bpa,
      full: 'Bachelor of Public Administration',
      desc: 'Prepares students for public service and governance. Projects cover digital systems for government record management, citizen services, and administrative workflows.',
    },
  ];

  return (
    <section id="courses" className="py-20" style={{ background: '#fff', borderTop: '1px solid #e5e7eb' }}>
      <div className="cdn-container">

        {/* Header */}
        <div className="flex items-end justify-between gap-6 flex-wrap mb-10 scroll-animate">
          <div>
            <span className="tag-label">Offered Programs</span>
            <h2 className="section-heading">College <span className="h-blue">Courses</span></h2>
            <p className="section-sub" style={{ margin: 0 }}>
              Four college programs committed to quality technical-vocational and professional education.
            </p>
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>
            4 Programs
          </span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {courses.map((c, i) => {
            const pill = colorPill[c.color];
            return (
              <div
                key={i}
                className={`relative overflow-hidden flex flex-col gap-3.5 p-7 transition-all duration-200 cursor-default scroll-animate stagger-${i + 1}`}
                style={{ background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 14 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = colorBorder[c.color]; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
              >
                {/* bg image for BPA */}
                {c.bg && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-cover bg-center pointer-events-none"
                    style={{ backgroundImage: `url(${c.bg})`, opacity: 0.06, filter: 'grayscale(1)', borderRadius: 14 }}
                  />
                )}

                {/* Icon + code pill inline */}
                <div className="relative z-10 flex items-center gap-3">
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{ width: 24, height: 24, color: pill.color }}
                  >
                    <div style={{ width: 24, height: 24 }}>{c.icon}</div>
                  </div>
                  <span
                    className="inline-block text-[0.72rem] font-black uppercase tracking-[1.5px] px-3 py-1 rounded"
                    style={{ background: pill.bg, color: pill.color }}
                  >
                    {c.code}
                  </span>
                </div>

                {/* Title */}
                <h3 className="relative z-10 m-0 font-extrabold leading-snug" style={{ fontSize: '0.95rem', color: '#0F1422', letterSpacing: '-0.2px' }}>
                  {c.full}
                </h3>

                {/* Desc */}
                <p className="relative z-10 m-0" style={{ fontSize: '0.855rem', color: '#4E5873', lineHeight: 1.75 }}>
                  {c.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Courses;
