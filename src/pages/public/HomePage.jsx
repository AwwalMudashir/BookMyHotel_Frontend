import Navbar from '../../components/core/Navbar';
import HomeHero from '../components/HomeHero';

const HomePage = () => (
  <div className="relative min-h-screen overflow-hidden bg-slate-50">
    <Navbar variant="hero" />
    <HomeHero />
  </div>
);

export default HomePage;
