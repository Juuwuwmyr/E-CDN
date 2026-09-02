import '../../styles/Courses.css';

const Courses = () => {
  const courses = [
    {
      code: 'BSIS',
      color: 'blue',
      full: 'Bachelor of Science in Information Systems',
      desc: 'Focuses on the design, development, and management of information systems. Students build web apps, databases, and enterprise solutions that address real institutional needs.',
      tags: ['Web Systems', 'Database', 'Networking', 'Software Dev'],
      count: 45,
    },
    {
      code: 'BTVTED-WFT',
      color: 'red',
      full: 'Bachelor of Technical-Vocational Teacher Education — Work for Food Technology',
      desc: 'Combines food technology with technical-vocational pedagogy. Projects include digital systems for food processing monitoring, inventory, and quality control.',
      tags: ['Food Tech', 'Process Systems', 'Inventory', 'Quality Control'],
      count: 32,
    },
    {
      code: 'BTVTED-CHS',
      color: 'gold',
      full: 'Bachelor of Technical-Vocational Teacher Education — Consumer & Hospitality Services',
      desc: 'Covers hospitality and consumer services education. Student projects include hotel reservation systems, service management tools, and customer portals.',
      tags: ['Hospitality', 'Reservation', 'Service Mgmt', 'Customer Portal'],
      count: 28,
    },
    {
      code: 'WFT',
      color: 'blue',
      full: 'Welding and Fabrication Technology',
      desc: 'Technical program on metal fabrication and welding. Projects cover digital job order systems, materials tracking, and fabrication workflow management tools.',
      tags: ['Job Orders', 'Materials Tracking', 'Workflow', 'Tech Systems'],
      count: 18,
    },
  ];

  return (
    <section className="courses" id="courses">
      <div className="container">

        
        <div className="courses-header scroll-animate">
          <div>
            <span className="tag-label">Offered Programs</span>
            <h2 className="section-heading">
              College <span className="blue">Courses</span>
            </h2>
            <p className="section-sub" style={{ margin: 0 }}>
              Four college programs whose students contribute deployed systems and
              capstone projects to this showcase portal.
            </p>
          </div>
          <span className="courses-header-count">4 Programs</span>
        </div>

        
        <div className="courses-grid">
          {courses.map((c, i) => (
            <div
              key={i}
              className={`course-card course-${c.color} scroll-animate stagger-${i + 1}`}
            >
              <div className="course-card-top">
                <div className="course-code-wrap">
                  <span className={`course-code code-${c.color}`}>{c.code}</span>
                </div>
                <h3 className="course-full">{c.full}</h3>
              </div>

              <p className="course-desc">{c.desc}</p>

              <div className="course-tags">
                {c.tags.map((t, ti) => (
                  <span key={ti} className="course-tag">{t}</span>
                ))}
              </div>

              <a href="#projects" className="course-link">
                View Projects <span aria-hidden="true">→</span>
              </a>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Courses;
