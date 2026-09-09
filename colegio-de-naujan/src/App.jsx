import { BrowserRouter, Routes, Route } from 'react-router-dom';
import useScrollAnimation from './hooks/useScrollAnimation';
import Header   from './components/Header/Header';
import Footer   from './components/Footer/Footer';
import HomePage     from './pages/HomePage';
import CoursesPage  from './pages/CoursesPage';
import ServicesPage from './pages/ServicesPage';
import AboutPage    from './pages/AboutPage';
import ContactPage  from './pages/ContactPage';

function Layout() {
  useScrollAnimation();

  return (
    <div className="w-full min-h-screen flex flex-col">
      <Header />
      <div style={{ paddingTop: '72px', flex: 1 }}>
        <Routes>
          <Route path="/"         element={<HomePage />}     />
          <Route path="/courses"  element={<CoursesPage />}  />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/about"    element={<AboutPage />}    />
          <Route path="/contact"  element={<ContactPage />}  />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;
