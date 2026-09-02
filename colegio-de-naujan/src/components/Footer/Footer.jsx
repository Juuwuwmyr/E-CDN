import '../../styles/Footer.css';
import cdnLogo from '../../assets/images/logo.png';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <>


      {/* ── Main Footer ── */}
      <footer className="footer" id="contact">
        <div className="footer-main">
          <div className="container footer-grid">

            {/* Brand */}
            <div className="footer-brand">
              <div className="footer-logo">
                <img
                  src={cdnLogo}
                  alt="Colegio De Naujan Logo"
                  className="footer-logo-img"
                />
                <div>
                  <div className="footer-school-name">Colegio De Naujan</div>
                  <div className="footer-school-dept">College Department</div>
                </div>
              </div>
              <p className="footer-about">
                Official portal for student capstone and course projects under
                the CDN College Department. Featuring deployed systems from
                BSIS, BTVTED-WFT, BTVTED-CHS, and WFT programs.
              </p>
              <div className="footer-social">
                <a href="#fb" className="social-btn">Facebook</a>
                <a href="#ig" className="social-btn">Instagram</a>
                <a href="#yt" className="social-btn">YouTube</a>
              </div>
            </div>

            {/* Portal */}
            <div>
              <p className="footer-col-title">Portal</p>
              <ul className="footer-col-links">
                <li><a href="#home">Home</a></li>
                <li><a href="#courses">Courses</a></li>
                <li><a href="#projects">Projects</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#submit">Submit Project</a></li>
              </ul>
            </div>

            {/* Courses */}
            <div>
              <p className="footer-col-title">Courses</p>
              <ul className="footer-col-links">
                <li><a href="#courses">BSIS</a></li>
                <li><a href="#courses">BTVTED-WFT</a></li>
                <li><a href="#courses">BTVTED-CHS</a></li>
                <li><a href="#courses">WFT</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="footer-col-title">Contact</p>
              <ul className="footer-contact-list">
                <li>
                  <span className="contact-label">Address</span>
                  Naujan, Oriental Mindoro, Philippines
                </li>
                <li>
                  <span className="contact-label">Email</span>
                  cdn.college@edu.ph
                </li>
                <li>
                  <span className="contact-label">Office Hours</span>
                  Mon – Fri: 8:00 AM – 5:00 PM
                </li>
                <li>
                  <span className="contact-label">Portal Admin</span>
                  cdn.portal@edu.ph
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <div className="container footer-bottom-inner">
            <p className="footer-copy">
              &copy; {year} Colegio De Naujan College Department. All rights reserved.
            </p>
            <div className="footer-bottom-links">
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Use</a>
              <a href="#sitemap">Sitemap</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
