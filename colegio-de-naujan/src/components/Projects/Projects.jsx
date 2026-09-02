import '../../styles/Projects.css';

const bsisProjects = [
  {
    year: '2026',
    title: 'Library Management System',
    desc: 'A web-based system for managing book inventory, student borrowing records, and librarian workflows.',
    tech: ['React', 'Node.js', 'MySQL'],
    authors: 'J. Reyes, M. Santos',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
    status: 'Deployed',
  },
  {
    year: '2026',
    title: 'Online Enrollment System',
    desc: 'Digitizes the school enrollment process — from application to section assignment — with admin dashboard.',
    tech: ['PHP', 'Laravel', 'PostgreSQL'],
    authors: 'A. Cruz, R. Dela Cruz',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80',
    status: 'Deployed',
  },
  {
    year: '2025',
    title: 'Faculty Attendance Tracker',
    desc: 'QR-code based attendance system for faculty with real-time dashboard and HR reporting module.',
    tech: ['Vue.js', 'Firebase', 'QR Code API'],
    authors: 'L. Garcia, P. Torres',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&q=80',
    status: 'Deployed',
  },
  {
    year: '2025',
    title: 'Student Records Portal',
    desc: 'Centralized portal for viewing and managing student academic records, grades, and enrollment history.',
    tech: ['React', 'Express', 'MongoDB'],
    authors: 'C. Bautista, T. Navarro',
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80',
    status: 'Deployed',
  },
  {
    year: '2024',
    title: 'Asset Monitoring System',
    desc: 'Tracks school properties and equipment — assignment, condition status, maintenance logs, and QR tagging.',
    tech: ['PHP', 'MySQL', 'Bootstrap'],
    authors: 'E. Reyes, F. Santos',
    image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80',
    status: 'Deployed',
  },
  {
    year: '2024',
    title: 'Clinic Management System',
    desc: 'Digital health records and consultation logbook for the school clinic with student visit tracking.',
    tech: ['React', 'Node.js', 'MySQL'],
    authors: 'G. Pascual, I. Soriano',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80',
    status: 'Deployed',
  },
];

const Projects = ({ isAuthenticated, onLoginClick }) => {
  return (
    <section className="projects" id="projects">
      <div className="container">

        {/* Header */}
        <div className="projects-header scroll-animate">
          <div className="projects-header-left">
            <span className="tag-label">BSIS Capstone &amp; Course Work</span>
            <h2 className="section-heading">
              Deployed <span className="blue">Projects</span>
            </h2>
            <p className="section-sub" style={{ margin: 0 }}>
              Systems built and deployed by Bachelor of Science in Information Systems
              students — real projects solving real institutional problems.
            </p>
          </div>
          <div className="projects-bsis-badge scroll-animate stagger-2">
            <span className="bsis-pill">BSIS</span>
            <span className="bsis-pill-label">Bachelor of Science<br />in Information Systems</span>
          </div>
        </div>

        {/* ── LOCK GATE — shown when not authenticated ── */}
        {!isAuthenticated ? (
          <div className="projects-lock-gate scroll-animate">
            <div className="projects-lock-preview" aria-hidden="true">
              {bsisProjects.slice(0, 3).map((p, i) => (
                <div key={i} className="project-card project-card--blurred">
                  <div className="project-img-wrap">
                    <img src={p.image} alt="" loading="lazy" />
                  </div>
                  <div className="project-body">
                    <div className="project-meta">
                      <span className="project-year">S.Y. {p.year}</span>
                    </div>
                    <h3 className="project-title">{p.title}</h3>
                    <div className="project-tech">
                      {p.tech.map((t, ti) => (
                        <span key={ti} className="tech-tag">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="projects-lock-overlay">
              <div className="projects-lock-box">
                <div className="lock-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                </div>
                <h3 className="lock-title">Sign In to View Projects</h3>
                <p className="lock-desc">
                  Access to BSIS project showcase is restricted to CDN staff
                  and students. Sign in with your portal credentials.
                </p>
                <button className="lock-btn" onClick={onLoginClick}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  Login to Access
                </button>
                <p className="lock-count">{bsisProjects.length} BSIS projects available</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Cards grid — authenticated view */}
            <div className="projects-grid">
              {bsisProjects.map((p, i) => (
                <article
                  key={`${p.title}-${i}`}
                  className={`project-card scroll-animate scale-up stagger-${(i % 6) + 1}`}
                >
                  <div className="project-img-wrap">
                    <img src={p.image} alt={p.title} loading="lazy" />
                    <span className="project-status-pill">{p.status}</span>
                  </div>

                  <div className="project-body">
                    <div className="project-meta">
                      <span className="project-year">S.Y. {p.year}</span>
                      <span className="project-authors">{p.authors}</span>
                    </div>
                    <h3 className="project-title">{p.title}</h3>
                    <p className="project-desc">{p.desc}</p>
                    <div className="project-tech">
                      {p.tech.map((t, ti) => (
                        <span key={ti} className="tech-tag">{t}</span>
                      ))}
                    </div>
                    <button className="project-view-btn">
                      View Project <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="projects-footer scroll-animate">
              <p className="projects-footer-text">
                Showing {bsisProjects.length} BSIS projects
              </p>
              <a href="#submit" className="btn-red">Submit Your Project</a>
            </div>
          </>
        )}

      </div>
    </section>
  );
};

export default Projects;
