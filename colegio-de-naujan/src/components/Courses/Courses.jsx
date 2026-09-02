import '../../styles/Courses.css';
import wftBg from '../../assets/images/background.jpg';

const Courses = () => {
  const courses = [
    {
      code: 'BSIS',
      color: 'blue',
      full: 'Bachelor of Science in Information Systems',
      desc: 'Focuses on the design, development, and management of information systems. Students build web apps, databases, and enterprise solutions that address real institutional needs.',
      tags: ['Web Systems', 'Database', 'Networking', 'Software Dev'],
      count: 45,
      bg: null,
    },
    {
      code: 'BTVTED-WFT',
      color: 'red',
      full: 'Bachelor of Technical-Vocational Teacher Education — Work for Food Technology',
      desc: 'Combines food technology with technical-vocational pedagogy. Projects include digital systems for food processing monitoring, inventory, and quality control.',
      tags: ['Food Tech', 'Process Systems', 'Inventory', 'Quality Control'],
      count: 32,
      bg: null,
    },
    {
      code: 'BTVTED-CHS',
      color: 'gold',
      full: 'Bachelor of Technical-Vocational Teacher Education — Computer Hardware Servicing',
      desc: 'Covers computer hardware servicing and technical-vocational education. Student projects include diagnostic tools, hardware inventory systems, and service management portals.',
      tags: ['Hardware', 'Diagnostics', 'Inventory', 'Service Mgmt'],
      count: 28,
      bg: null,
    },
    {
      code: 'BPA',
      color: 'blue',
      full: 'Bachelor of Public Administration',
      desc: 'Prepares students for public service and governance. Projects cover digital systems for government record management, citizen services, and administrative workflows.',
      tags: ['Gov Systems', 'Records Mgmt', 'Public Service', 'Admin Tools'],
      count: 18,
      bg: wftBg,
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
              className={`course-card course-${c.color} scroll-animate stagger-${i + 1}${c.bg ? ' course-has-bg' : ''}`}
              style={c.bg ? { '--course-bg': `url(${c.bg})` } : {}}
            >
              {/* background image layer — only rendered when bg is set */}
              {c.bg && (
                <div className="course-bg-img" aria-hidden="true" />
              )}

              <div className="course-card-inner">
                <div className="course-card-top">
                  <div className="course-code-wrap">
                    <span className={`course-code code-${c.color}`}>{c.code}</span>
                  </div>
                  <h3 className="course-full">{c.full}</h3>
                </div>

                <p className="course-desc">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Courses;
