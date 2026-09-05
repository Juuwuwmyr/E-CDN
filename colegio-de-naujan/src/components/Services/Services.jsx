const hoverBorder = { blue: '#002280', red: '#C8102E', gold: '#C8960C' };
const iconColor   = { blue: '#002280', red: '#C8102E', gold: '#C8960C' };

const icons = {
  enrollment: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="12" y1="18" x2="12" y2="12"/>
      <line x1="9"  y1="15" x2="15" y2="15"/>
    </svg>
  ),
  library: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    </svg>
  ),
  student: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  registrar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8"  y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  cashier: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1"  y1="10" x2="23" y2="10"/>
    </svg>
  ),
  health: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  ),
};

const Services = () => {
  const services = [
    { color: 'gold', icon: icons.enrollment, title: 'Enrollment & Registration',   desc: "Streamlined enrollment process for new and returning students across all college programs. Requirements and schedules are available at the Registrar's Office." },
    { color: 'gold',  icon: icons.library,    title: 'Library Services',            desc: 'Access to academic resources, reference materials, journals, and research tools. Library card issuance and borrowing available to all enrolled students.' },
    { color: 'gold', icon: icons.student,    title: 'Student Affairs',             desc: 'Guidance counseling, scholarships, student organizations, and extracurricular activities. The Office of Student Affairs supports holistic student development.' },
    { color: 'gold', icon: icons.registrar,  title: 'Registrar Services',          desc: 'Issuance of transcript of records, certificates of enrollment, diplomas, and other official school documents. Processing times and fees apply.' },
    { color: 'gold',  icon: icons.cashier,    title: 'Cashier & Finance',           desc: 'NEAP scholarship processing, payment transactions, and financial assistance inquiries. The Finance Office handles all monetary transactions and official receipts.' },
    { color: 'gold', icon: icons.health,     title: 'Health & Wellness',           desc: 'On-campus clinic providing basic medical consultations, first aid, health certificates, and referrals. Open to students, faculty, and staff during office hours.' },
  ];

  return (
    <section id="services" className="py-20" style={{ background: '#f4f6fb', borderTop: '1px solid #e5e7eb' }}>
      <div className="cdn-container">

        <div className="mb-10 scroll-animate">
          <span className="tag-label">What We Offer</span>
          <h2 className="section-heading">School <span className="h-blue">Services</span></h2>
          <p className="section-sub" style={{ margin: 0 }}>
            Colegio De Naujan provides a range of academic and administrative services
            to support every student throughout their education journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s, i) => (
            <div
              key={i}
              className={`flex flex-col gap-3 p-7 transition-all duration-200 cursor-default scroll-animate stagger-${(i % 3) + 1}`}
              style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 14 }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = hoverBorder[s.color];
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'none';
              }}
            >
              {/* Icon + Title inline */}
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{ width: 24, height: 24, color: iconColor[s.color] }}
                >
                  <div style={{ width: 24, height: 24 }}>{s.icon}</div>
                </div>
                <h3 className="m-0 font-extrabold leading-snug" style={{ fontSize: '1rem', color: '#0F1422' }}>
                  {s.title}
                </h3>
              </div>
              <p className="m-0" style={{ fontSize: '0.875rem', color: '#4E5873', lineHeight: 1.7 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
