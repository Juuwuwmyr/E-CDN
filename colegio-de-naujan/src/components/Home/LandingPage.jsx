/**
 * LandingPage.jsx
 * Single scrollable page with all public sections.
 * Each section has an id matching the nav key.
 */
import Hero       from '../Hero/Hero';
import FacebookFeed from './FacebookFeed';
import Courses    from '../Courses/Courses';
import Services   from '../Services/Services';
import About      from '../About/About';
import MapSection from '../Map/MapSection';

const LandingPage = () => (
  <>
    {/* id="home" is set inside Hero itself */}
    <Hero />

    <FacebookFeed />

    <section id="courses">
      <Courses />
    </section>

    <section id="services">
      <Services />
    </section>

    <section id="about">
      <About />
    </section>

    <section id="contact">
      <MapSection />
    </section>
  </>
);

export default LandingPage;
