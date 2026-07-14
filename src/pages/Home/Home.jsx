import { lazy, Suspense } from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import Navbar from '../../components/Navbar/Navbar';
import Hero from '../../components/Hero/Hero';
import ToolGrid from '../../components/ToolGrid/ToolGrid';
import Categories from '../../components/Categories/Categories';
import Workflows from '../../components/Workflows/Workflows';
// import Statistics from '../../components/Statistics/Statistics';
import Testimonials from '../../components/Testimonials/Testimonials';
import FAQ from '../../components/FAQ/FAQ';
import FinalCTA from '../../components/FinalCTA/FinalCTA';
import Footer from '../../components/Footer/Footer';
import BackToTop from '../../components/BackToTop/BackToTop';
import './Home.css';

const Playground = lazy(() => import('../../components/Playground/Playground'));

function Home() {
  useScrollReveal();

  return (
    <div className="home">
      <Navbar />
      <Hero />
      <ToolGrid />
      <Suspense fallback={<div style={{ minHeight: '600px' }} />}>
        <Playground />
      </Suspense>
      <Categories />
      <Workflows />
      {/* <Statistics /> */}
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
      <BackToTop />
    </div>
  );
}

export default Home;
