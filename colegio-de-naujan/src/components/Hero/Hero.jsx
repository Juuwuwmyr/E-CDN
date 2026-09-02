import '../../styles/Hero.css';
import ParticleCanvas from './ParticleCanvas';
import bgImg from '../../assets/images/background.jpg';

const Hero = ({ onLoginClick }) => {
  const stats = [
    { value: '45+',  label: 'BSIS Projects'   },
    { value: '120+', label: 'Total Deployed'   },
    { value: '300+', label: 'Student Devs'     },
    { value: '3',    label: 'Academic Years'   },
  ];

  return (
    <section className="hero" id="home">
      <div className="hero-bg-grid" aria-hidden="true" />
      <div
        className="hero-bg-photo"
        style={{ backgroundImage: `url(${bgImg})` }}
        aria-hidden="true"
      />
      <ParticleCanvas />

      <div className="container hero-inner">

        
        <div className="hero-left scroll-animate from-left">
          <div className="hero-eyebrow">
            <span className="eyebrow-dot" />
            CDN College — BSIS Project Portal
          </div>

          <h1 className="hero-heading">
            Built by Students.<br />
            <span className="hero-heading-blue">Deployed</span>{' '}
            <span className="hero-heading-red">for Real.</span>
          </h1>

          <p className="hero-body">
            Explore capstone and course projects built and deployed by
            Colegio De Naujan BSIS students — real-world systems solving
            real institutional problems, not just school submissions.
          </p>

          <div className="hero-actions">
            <a href="#projects" className="btn-primary">Browse BSIS Projects</a>
            <button className="btn-ghost" onClick={onLoginClick}>
              Login to Access
            </button>
          </div>

          <div className="hero-stats">
            {stats.map((s, i) => (
              <div key={i} className="hero-stat">
                <span className="hero-stat-val">{s.value}</span>
                <span className="hero-stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        
        <div className="hero-right scroll-animate from-right">
          <div className="hero-card-stack">
            <div className="hero-img-frame">
              <img
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=900&q=85"
                alt="BSIS students working on their capstone projects"
                className="hero-img"
              />
              <div className="hero-img-bar">
                <div className="img-bar-dot blue" />
                <div className="img-bar-dot red"  />
                <div className="img-bar-dot gold" />
                <span className="img-bar-text">cdn-bsis-projects.portal</span>
              </div>
            </div>

            <div className="hero-float-card hero-float-top">
              <span className="float-card-label">Latest Submission</span>
              <span className="float-card-title">Library Management System</span>
              <span className="float-card-course">BSIS · S.Y. 2026</span>
            </div>

            <div className="hero-float-card hero-float-bottom">
              <span className="float-card-number">45 Projects</span>
              <span className="float-card-sub">
                BSIS · Bachelor of Science<br />in Information Systems
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
