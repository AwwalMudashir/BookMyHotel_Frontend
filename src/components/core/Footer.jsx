import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, Sparkles, X as XIcon } from 'lucide-react';
import { FacebookIcon, InstagramIcon, LinkedinIcon, YoutubeIcon } from './SocialIcons';

const exploreLinks = [
  { to: '/', label: 'Home' },
  { to: '/hotels', label: 'Hotels' },
  { to: '/search', label: 'Search rooms' },
  { to: '/contact', label: 'Contact us' },
];

const accountLinks = [
  { to: '/my-bookings', label: 'My bookings' },
  { to: '/profile', label: 'Profile' },
];

const socialLinks = [
  { Icon: InstagramIcon, label: 'Instagram' },
  { Icon: FacebookIcon, label: 'Facebook' },
  { Icon: XIcon, label: 'X (Twitter)' },
  { Icon: LinkedinIcon, label: 'LinkedIn' },
  { Icon: YoutubeIcon, label: 'YouTube' },
];

const currentYear = new Date().getFullYear();

// Purpose: Shared site footer with navigation and contact details.
const Footer = () => (
  <footer className="border-t border-slate-200 bg-[#1A1A2E] text-white/70">
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0A7C6E]/20 text-[#8FD9CC]">
              <Sparkles size={18} />
            </span>
            <span className="font-[Playfair_Display] text-lg font-semibold text-white">BookMyHotel</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-white/60">
            Reservations across Marriott, Hilton, Hyatt, and Four Seasons properties in Asia and Europe — one search,
            one checkout, headquartered in Dubai.
          </p>
          <div className="mt-5 flex items-center gap-2">
            {socialLinks.map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/15 text-white/60 transition hover:border-[#8FD9CC] hover:text-[#8FD9CC]"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Explore</p>
          <ul className="mt-4 space-y-2.5">
            {exploreLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-sm text-white/70 transition hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Your account</p>
          <ul className="mt-4 space-y-2.5">
            {accountLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-sm text-white/70 transition hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Get in touch</p>
          <ul className="mt-4 space-y-3">
            <li className="flex items-start gap-2.5 text-sm text-white/70">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#8FD9CC]" />
              Dubai, United Arab Emirates
            </li>
            <li className="flex items-center gap-2.5 text-sm text-white/70">
              <Mail className="h-4 w-4 shrink-0 text-[#8FD9CC]" />
              hello@bookmyhotel.com
            </li>
            <li className="flex items-center gap-2.5 text-sm text-white/70">
              <Phone className="h-4 w-4 shrink-0 text-[#8FD9CC]" />
              +971 4 000 0000
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
        <p className="text-xs text-white/50">© {currentYear} BookMyHotel. All rights reserved.</p>
        <p className="text-xs text-white/50">Payments secured by Stripe</p>
      </div>
    </div>
  </footer>
);

export default Footer;
