import Navbar from '../../components/core/Navbar';
import Footer from '../../components/core/Footer';
import HomeHero from '../components/HomeHero';
import HomePromotionsCarousel from '../components/HomePromotionsCarousel';
import HomePromoSubscription from '../components/HomePromoSubscription';
import FeaturedHotels from '../components/FeaturedHotels';
import PopularRooms from '../components/PopularRooms';
import SiteFeatures from '../components/SiteFeatures';
import AboutBookMyHotel from '../components/AboutBookMyHotel';
import HomeCta from '../components/HomeCta';
import HomePackagesSection from '../components/HomePackagesSection';

const HomePage = ({ initialAuthMode = null }) => (
  <div className="relative min-h-screen overflow-hidden bg-slate-50">
    <Navbar variant="hero" initialAuthMode={initialAuthMode} />
    <HomeHero />
    <FeaturedHotels />
    <PopularRooms />
    <HomePromotionsCarousel />
    <HomePackagesSection />
    <HomePromoSubscription />
    <SiteFeatures />
    <AboutBookMyHotel />
    <HomeCta />
    <Footer />
  </div>
);

export default HomePage;
