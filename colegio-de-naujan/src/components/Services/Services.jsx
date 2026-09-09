const hoverBorder = { blue: '#002280', red: '#C8102E', gold: '#C8960C' };

const icons = {
  csc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
      <line x1="7" y1="15" x2="7.01" y2="15"/>
      <line x1="11" y1="15" x2="13" y2="15"/>
    </svg>
  ),
  osas: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  ),
  admission: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <path d="M9 13h6M9 17h4"/>
    </svg>
  ),
};

const Services = () => {
  const services = [
    {
      color: 'blue',
      icon: icons.csc,
      title: 'CSC Services',
      url: 'https://student-fines-hub-vf9z.vercel.app/',
      desc: 'The CSC Fines Management System handles the recording, monitoring, and collection of student fines issued by the College Student Council.',
      features: [
        'Fine issuance & recording',
        'Student fine balance tracking',
        'Payment confirmation & history',
        'Clearance based on fine settlement',
      ],
    },
    {
      color: 'red',
      icon: icons.osas,
      title: 'OSAS Services',
      url: 'https://osas-sys.duckdns.org/',
      desc: 'The OSAS Violation Tracking System records and monitors student violations. Once a violation is committed, it is logged and listed under the student\'s record by OSAS.',
      features: [
        'Violation logging & case recording',
        'Student violation history tracking',
        'Sanctions & penalty management',
        'Clearance processing for resolved cases',
      ],
    },
    {
      color: 'gold',
      icon: icons.admission,
      title: 'Admission Services',
      url: 'https://ecnesis.duckdns.org/',
      desc: 'The Admission Services system streamlines the application process for incoming students — from initial inquiry through enrollment confirmation.',
      features: [
        'Online application & form submission',
        'Entrance exam scheduling',
        'Application status tracking',
        'Document upload & verification',
      ],
    },
  ];

  return (
    <section id="services" className="py-12 lg:py-20" style={{ background: '#f4f6fb', borderTop: '1px solid #e5e7eb' }}>
      <div className="cdn-container">

        <div className="mb-10 scroll-animate">
          <span className="tag-label">What We Offer</span>
          <h2 className="section-heading">School <span className="h-blue">Services</span></h2>
          <p className="section-sub" style={{ margin: 0 }}>
            Colegio De Naujan provides officially approved digital systems to support
            every student throughout their education journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <div
              key={i}
              className={`flex flex-col gap-4 p-7 transition-all duration-200 cursor-default scroll-animate stagger-${i + 1}`}
              style={{
                background: '#fff',
                border: '1.5px solid #e5e7eb',
                borderRadius: 14,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = `0 10px 30px ${hoverBorder[s.color]}20`;
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'none';
              }}
            >
              {/* Icon + Title */}
              <div className="flex items-center gap-3">
                <div style={{ width: 22, height: 22, color: '#C8960C', flexShrink: 0 }}>
                  {s.icon}
                </div>
                <h3 className="m-0 font-extrabold leading-snug" style={{ fontSize: '1.05rem', color: '#0F1422' }}>
                  {s.title}
                </h3>
              </div>



              {/* Description */}
              <p className="m-0" style={{ fontSize: '0.875rem', color: '#4E5873', lineHeight: 1.7 }}>
                {s.desc}
              </p>

              {/* Feature list */}
              <ul className="m-0 p-0" style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {s.features.map((f, fi) => (
                  <li key={fi} className="flex items-start gap-2" style={{ fontSize: '0.8125rem', color: '#4E5873' }}>
                    <span style={{ color: hoverBorder[s.color], fontWeight: 700, marginTop: 2, flexShrink: 0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* Visit button — bottom right */}
              <div className="flex justify-end mt-auto pt-2">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold transition-all duration-150"
                  style={{
                    fontSize: '0.8rem',
                    color: '#002280',
                    textDecoration: 'none',
                    borderBottom: '1.5px solid rgba(0,34,128,0.25)',
                    paddingBottom: 2,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderBottomColor = '#002280'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderBottomColor = 'rgba(0,34,128,0.25)'; }}
                >
                  Visit
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Services;
