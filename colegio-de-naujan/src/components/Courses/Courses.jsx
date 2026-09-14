import { useState } from 'react';
import CourseModal from './CourseModal';
import wftBg from '../../assets/images/background.jpg';
import bsisBg from '../../assets/images/background.jpg';
import chsbg from '../../assets/images/background.jpg';

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
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  const courses = [
    {
      code: 'BSIS', color: 'gold', bg: bsisBg, icon: icons.bsis,
      full: 'Bachelor of Science in Information Systems',
      desc: 'Focuses on the design, development, and management of information systems. Students build web apps, databases, and enterprise solutions that address real institutional needs.',
      duration: '4 years',
      credits: '120+ units',
      highlights: [
        'Web Application Development',
        'Database Management Systems',
        'Enterprise Solutions Design',
        'Systems Analysis and Design',
        'IT Project Management',
        'Cybersecurity Fundamentals',
      ],
      careerPaths: ['Software Developer', 'Systems Analyst', 'IT Manager', 'Database Admin', 'IT Consultant'],
    },
    {
      code: 'BTVTED-WFT', color: 'gold', bg: chsbg, icon: icons.wft,
      full: 'Bachelor of Technical-Vocational Teacher Education — Welding and Fabrication Technology',
      desc: 'Covers welding techniques, metal fabrication, and technical-vocational education. Projects include digital job order systems, materials tracking, and fabrication workflow management tools.',
      duration: '4 years',
      credits: '120+ units',
      highlights: [
        'Advanced Welding Techniques',
        'Metal Fabrication Processes',
        'Technical Education Methods',
        'Safety and Quality Standards',
        'Digital Documentation Systems',
        'Industry-Standard Equipment Training',
      ],
      careerPaths: ['Vocational Instructor', 'Welding Technician', 'Fabrication Specialist', 'Training Coordinator', 'Quality Control Specialist'],
    },
    {
      code: 'BTVTED-CHS', color: 'gold', bg: chsbg, icon: icons.chs,
      full: 'Bachelor of Technical-Vocational Teacher Education — Computer Hardware Servicing',
      desc: 'Covers computer hardware servicing and technical-vocational education. Student projects include diagnostic tools, hardware inventory systems, and service management portals.',
      duration: '4 years',
      credits: '120+ units',
      highlights: [
        'Hardware Diagnostics & Repair',
        'System Troubleshooting',
        'Technical Education Delivery',
        'Hardware Inventory Management',
        'Preventive Maintenance',
        'Industry Certifications',
      ],
      careerPaths: ['IT Technician', 'Hardware Support Specialist', 'Vocational Instructor', 'Service Center Manager', 'Technical Trainer'],
    },
    {
      code: 'BPA', color: 'gold', bg: wftBg, icon: icons.bpa,
      full: 'Bachelor of Public Administration',
      desc: 'Prepares students for public service and governance. Projects cover digital systems for government record management, citizen services, and administrative workflows.',
      duration: '4 years',
      credits: '120+ units',
      highlights: [
        'Public Policy Development',
        'Governance & Administration',
        'Government Information Systems',
        'Public Finance Management',
        'Citizen Services Programs',
        'Administrative Leadership',
      ],
      careerPaths: ['Government Administrator', 'Policy Analyst', 'Public Manager', 'Civil Service Official', 'Community Development Officer'],
    },
  ];

  return (
    <section id="courses" className="py-12 lg:py-20" style={{ background: '#fff', borderTop: '1px solid #e5e7eb' }}>
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
                className={`relative overflow-hidden flex flex-col gap-3.5 p-0 transition-all duration-200 cursor-pointer scroll-animate stagger-${i + 1}`}
                style={{ background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 14 }}
                onClick={() => setSelectedCourse(c)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = colorBorder[c.color]; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
              >
                {/* Image Placeholder */}
                <div
                  className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0"
                  style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
                >
                  <div className="text-center pointer-events-none">
                    <svg
                      className="w-12 h-12 mx-auto mb-2 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-gray-500 text-xs font-medium">Click to view details</p>
                  </div>
                </div>

                {/* bg image for BPA */}
                {c.bg && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-cover bg-center pointer-events-none"
                    style={{ backgroundImage: `url(${c.bg})`, opacity: 0.06, filter: 'grayscale(1)', borderRadius: 14 }}
                  />
                )}

                {/* Content Container */}
                <div className="p-7 flex flex-col gap-3.5 relative z-10">
                  {/* Icon + code pill inline */}
                  <div className="flex items-center gap-3">
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
                  <h3 className="m-0 font-extrabold leading-snug" style={{ fontSize: '0.95rem', color: '#0F1422', letterSpacing: '-0.2px' }}>
                    {c.full}
                  </h3>

                  {/* Desc */}
                  <p className="m-0" style={{ fontSize: '0.855rem', color: '#4E5873', lineHeight: 1.75 }}>
                    {c.desc}
                  </p>

                  {/* Click hint */}
                  <div className="pt-2 flex items-center gap-1 text-xs" style={{ color: colorBorder[c.color] }}>
                    <span>Click to learn more</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Course Modal */}
      <CourseModal 
        course={selectedCourse} 
        isOpen={!!selectedCourse} 
        onClose={() => setSelectedCourse(null)}
        colorBorder={colorBorder}
        colorPill={colorPill}
      />
    </section>
  );
};

export default Courses;
