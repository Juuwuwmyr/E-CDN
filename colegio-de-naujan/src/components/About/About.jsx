import '../../styles/About.css';

const About = () => {
  const pillars = [
    {
      num: '01',
      color: 'blue',
      label: 'Foundation',
      title: 'Academic Rigor',
      desc: 'Projects meet actual course requirements — real systems, real clients, real data. Not prototypes.',
    },
    {
      num: '02',
      color: 'red',
      label: 'Impact',
      title: 'Practical Deployment',
      desc: 'Every featured system is deployed and in active use, not just submitted as a school requirement.',
    },
    {
      num: '03',
      color: 'gold',
      label: 'Innovation',
      title: 'Cross-Discipline Innovation',
      desc: 'BSIS, BTVTED, and WFT students solve unique problems specific to their fields — food tech, hospitality, fabrication, and IT.',
    },
  ];

  return (
    <section className="about" id="about">
      <div className="container">

        
        <div className="about-grid">

          
          <div className="about-left scroll-animate from-left">
            <span className="tag-label">About This Portal</span>
            <h2 className="section-heading">
              A Showcase of CDN<br />
              <span className="blue">Student Innovation.</span>
            </h2>
            <p className="about-body">
              The CDN College Project Showcase is the official repository for
              capstone and course-based systems built by students of the
              Colegio De Naujan College Department.
            </p>
            <p className="about-body">
              This portal exists to document, share, and celebrate student work
              — providing future students, faculty, and the public a transparent
              view of what CDN college students can build and deploy.
            </p>

            <div className="about-highlight-bar">
              <div className="highlight-item">
                <span className="highlight-val">S.Y. 2023</span>
                <span className="highlight-lbl">Portal launched</span>
              </div>
              <div className="highlight-divider" />
              <div className="highlight-item">
                <span className="highlight-val">4 Courses</span>
                <span className="highlight-lbl">Contributing programs</span>
              </div>
              <div className="highlight-divider" />
              <div className="highlight-item">
                <span className="highlight-val">Open</span>
                <span className="highlight-lbl">Publicly viewable</span>
              </div>
            </div>
          </div>

          
          <div className="about-right">
            {pillars.map((p, i) => (
              <div
                key={i}
                className={`pillar-card pillar-${p.color} scroll-animate from-right stagger-${i + 1}`}
              >
                
                <div className={`pillar-tag pillar-tag-${p.color}`}>
                  <span className="pillar-tag-label">{p.label}</span>
                </div>

                
                <div className={`pillar-num-badge pillar-badge-${p.color}`}>
                  {p.num}
                </div>

                <div className="pillar-body">
                  <h3 className="pillar-title">{p.title}</h3>
                  <p className="pillar-desc">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        
        <div className="about-banner scroll-animate">
          <div className="about-banner-text">
            <span className="about-banner-tag">Our Mission</span>
            <h2 className="about-banner-heading">
              Every system here was built by a CDN student — for a real purpose, with real impact.
            </h2>
            <p className="about-banner-sub">
              "Education that produces — not just graduates, but builders."
            </p>
          </div>
          <a href="#projects" className="about-banner-btn">
            Explore Projects
          </a>
        </div>

      </div>
    </section>
  );
};

export default About;
