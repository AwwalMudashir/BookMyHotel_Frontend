import Navbar from '../../components/core/Navbar';
import Footer from '../../components/core/Footer';
import HomeHero from '../components/HomeHero';
import FeaturedHotels from '../components/FeaturedHotels';
import PopularRooms from '../components/PopularRooms';
import SiteFeatures from '../components/SiteFeatures';
import AboutBookMyHotel from '../components/AboutBookMyHotel';
import HomeCta from '../components/HomeCta';

const HomePage = () => (
  <div className="relative min-h-screen overflow-hidden bg-slate-50">
    <Navbar variant="hero" />
    <HomeHero />
    <FeaturedHotels />
    <PopularRooms />
    <SiteFeatures />
    <AboutBookMyHotel />
    <HomeCta />
    <Footer />
  </div>
);

export default HomePage;
