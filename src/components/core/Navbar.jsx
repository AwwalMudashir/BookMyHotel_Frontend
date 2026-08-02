import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Hotel, Compass, Mail, Menu, Sparkles, X, LogIn, LogOut, UserCircle, LayoutGrid, Leaf } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthModal from './AuthModal';
import CurrencySwitcher from './CurrencySwitcher';
import { useAuth } from '../../hooks/useAuth';

const guestLinks = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/hotels', label: 'Hotels', icon: Hotel },
  { to: '/search', label: 'Activities', icon: Compass },
  { to: '/contact', label: 'Contact', icon: Mail },
];

const linkBaseClasses = 'flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors';

const Navbar = ({ variant = 'default' }) => {
  const {
    login: loginUser,
    loginWithGoogle,
    register: registerUser,
    user,
    role,
    isAuthenticated,
    logout: logoutUser,
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authSuccessMessage, setAuthSuccessMessage] = useState('');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleAuthRequired = () => {
      setAuthMode('login');
      setAuthOpen(true);
    };

    window.addEventListener('auth:required', handleAuthRequired);
    return () => window.removeEventListener('auth:required', handleAuthRequired);
  }, []);

  const isHomeRoute = location.pathname === '/';
  const isHeroVariant = variant === 'hero' || isHomeRoute;
  const isFixedNav = isHeroVariant;
  const shouldUseTransparentBg = isHeroVariant && !isScrolled;
  const shouldUseSolidBg = isScrolled || (!isHeroVariant && !shouldUseTransparentBg);

  const shellClasses = shouldUseSolidBg
    ? 'border-gray-100 bg-white/80 text-slate-900 shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl'
    : 'border-transparent bg-transparent text-white';

  const navContainerClasses = isFixedNav
    ? 'fixed inset-x-0 top-0 z-[60] transition-all duration-300'
    : 'relative w-full transition-all duration-300';

  const iconBadgeClasses = shouldUseSolidBg
    ? 'bg-[#0A7C6E]/10 text-[#0A7C6E]'
    : 'bg-white/15 text-white';
  const linkClasses = ({ isActive }) => {
    const base = `${linkBaseClasses} ${shouldUseSolidBg ? 'text-slate-700 hover:bg-gray-100 hover:text-slate-900' : 'text-white hover:bg-white/10'}`;
    return isActive
      ? `${base} ${shouldUseSolidBg ? 'bg-[#0A7C6E]/10 text-[#0A7C6E]' : 'bg-white/15'}`
      : base;
  };

  const secondaryButtonClasses = shouldUseSolidBg
    ? 'border-gray-200 text-gray-700 hover:border-[#0A7C6E] hover:text-[#0A7C6E]  cursor-pointer '
    : 'border-white/40 text-white hover:bg-white/10  cursor-pointer ';

  const primaryButtonClasses = shouldUseSolidBg
    ? 'bg-[#0A7C6E] text-white hover:bg-[#0A7C6E]/90  cursor-pointer '
    : 'bg-white text-[#0A7C6E] hover:bg-gray-100  cursor-pointer ';

  const drawerClasses = shouldUseSolidBg ? 'bg-white text-slate-900' : 'bg-[#0A7C6E] text-white';

  const drawerLinkClasses = ({ isActive }) =>
    `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium ${
      isActive
        ? shouldUseSolidBg
          ? 'bg-[#0A7C6E]/10 text-[#0A7C6E]'
          : 'bg-white/15 text-white'
        : shouldUseSolidBg
          ? 'text-slate-700 hover:bg-gray-100'
          : 'text-white/90 hover:bg-white/10'
    }`;

  const redirectByRole = (roleName) => {
    if (roleName === 'CUSTOMER') {
      navigate('/');
      return;
    }

    if (roleName === 'HOTEL_MANAGER') {
      navigate('/manager/dashboard');
      return;
    }

    if (roleName === 'ADMIN') {
      navigate('/admin/dashboard');
      return;
    }

    navigate('/');
  };

  const handleAuthSubmit = async (values) => {
    const { mode, firstName, lastName, email, password } = values;

    if (mode === 'login') {
      try {
        const rememberMe = values?.rememberMe;
        const response = await loginUser({ email, password, rememberMe });
        const roleName = response?.user?.role || response?.role || 'GUEST';
        setAuthSuccessMessage('');
        toast.success('Signed in successfully');
        redirectByRole(roleName);
        setAuthOpen(false);
      } catch (error) {
        toast.error(error.message || 'Unable to sign in. Please try again.');
        navigate('/');
      }
      return;
    }

    try {
      await registerUser({ firstName, lastName, email, password });
      setAuthSuccessMessage('Account created successfully. You can now sign in.');
      setAuthMode('login');
      setAuthOpen(true);
      toast.success('Account created successfully. Please sign in.');
    } catch (error) {
      toast.error(error.message || 'Unable to create your account.');
    }
  };

  const handleGoogleAuth = async (idToken) => {
    const response = await loginWithGoogle(idToken);
    const roleName = response?.role || 'GUEST';
    setAuthSuccessMessage('');
    toast.success('Signed in with Google');
    redirectByRole(roleName);
    setAuthOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success('You have been signed out');
      setMobileOpen(false);
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Unable to sign out right now.');
    }
  };

  const renderAuthenticatedActions = () => {
    const dashboardPath = role === 'HOTEL_MANAGER' ? '/manager/dashboard' : role === 'ADMIN' ? '/admin/dashboard' : '/';

    return (
      <>
        {role === 'CUSTOMER' && (
          <>
            <NavLink to="/my-bookings" className={linkClasses}>
              <LayoutGrid size={16} />
              <span>My bookings</span>
            </NavLink>
            <NavLink to="/profile" className={linkClasses}>
              <UserCircle size={16} />
              <span>Profile</span>
            </NavLink>
          </>
        )}
        {role !== 'CUSTOMER' && (
          <NavLink to={dashboardPath} className={linkClasses}>
            <LayoutGrid size={16} />
            <span>Dashboard</span>
          </NavLink>
        )}
      </>
    );
  };

  const renderGuestNav = () => (
    <>
      <nav className={`h-14 transition-all duration-300 md:h-16 ${navContainerClasses} ${shellClasses}`}>
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <NavLink to="/" className="flex items-center gap-2">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full ${iconBadgeClasses}`}>
              <Sparkles size={18} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-[Playfair_Display] text-lg font-semibold">BookMyHotel</span>
              <span className={`text-[11px] ${shouldUseSolidBg ? 'text-gray-500' : 'text-white/70'}`}>Stay beautifully</span>
            </div>
          </NavLink>

          <div className="hidden items-center gap-1 md:flex">
            {guestLinks.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={linkClasses}>
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            ))}
            {isAuthenticated && renderAuthenticatedActions()}
          </div>

          <div className="flex items-center gap-2">
            <CurrencySwitcher buttonClassName={secondaryButtonClasses} />
            {isAuthenticated ? (
              <>
                {role === 'CUSTOMER' ? (
                  <span
                    className={`hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium sm:inline-flex ${shouldUseSolidBg ? 'bg-[#E2F0E8] text-[#1D6A2D]' : 'bg-white/15 text-white'}`}
                    title="Eco points earned from eco-friendly stays"
                  >
                    <Leaf size={14} />
                    {user?.ecoPoints ?? 0}
                  </span>
                ) : null}
                <span className={`hidden rounded-full px-3 py-2 text-sm font-medium sm:inline-flex ${shouldUseSolidBg ? 'bg-[#0A7C6E]/10 text-[#0A7C6E]' : 'bg-white/15 text-white'}`}>
                  Hi, {user?.firstName || 'Traveler'}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${secondaryButtonClasses}`}
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthOpen(true);
                  }}
                  className={`hidden rounded-full cursor-pointer border px-4 py-2 text-sm font-medium transition sm:inline-flex ${secondaryButtonClasses}`}
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthOpen(true);
                  }}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${primaryButtonClasses}`}
                >
                  <LogIn size={16} />
                  Sign up
                </button>
              </>
            )}

            <button
              type="button"
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition md:hidden ${secondaryButtonClasses}`}
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-60 bg-black/30 md:hidden" onClick={() => setMobileOpen(false)}>
          <div
            className={`ml-auto flex h-full w-4/5 max-w-sm flex-col p-4 shadow-xl ${drawerClasses}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`flex items-center justify-between border-b pb-4 ${shouldUseSolidBg ? 'border-gray-100' : 'border-white/20'}`}>
              <div className="flex items-center gap-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${iconBadgeClasses}`}>
                  <Sparkles size={18} />
                </div>
                <span className="font-[Playfair_Display] text-lg font-semibold">BookMyHotel</span>
              </div>
              <button
                type="button"
                className={`flex h-10 w-10 items-center justify-center rounded-full ${shouldUseSolidBg ? 'bg-gray-100 text-gray-700' : 'bg-white/10 text-white'}`}
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {guestLinks.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} className={drawerLinkClasses}>
                  <Icon size={16} />
                  <span>{label}</span>
                </NavLink>
              ))}
              {isAuthenticated && (
                <>
                  {role === 'CUSTOMER' ? (
                    <>
                      <NavLink to="/my-bookings" onClick={() => setMobileOpen(false)} className={drawerLinkClasses}>
                        <LayoutGrid size={16} />
                        <span>My bookings</span>
                      </NavLink>
                      <NavLink to="/profile" onClick={() => setMobileOpen(false)} className={drawerLinkClasses}>
                        <UserCircle size={16} />
                        <span>Profile</span>
                      </NavLink>
                    </>
                  ) : (
                    <NavLink to={role === 'HOTEL_MANAGER' ? '/manager/dashboard' : role === 'ADMIN' ? '/admin/dashboard' : '/'} onClick={() => setMobileOpen(false)} className={drawerLinkClasses}>
                      <LayoutGrid size={16} />
                      <span>Dashboard</span>
                    </NavLink>
                  )}
                </>
              )}
            </div>

            {!isAuthenticated ? (
              <div className={`mt-6 flex flex-col gap-3 border-t pt-4 ${shouldUseSolidBg ? 'border-gray-100' : 'border-white/20'}`}>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setAuthMode('login');
                    setAuthOpen(true);
                  }}
                  className={`rounded-2xl cursor-pointer border px-4 py-3 text-center text-sm font-medium ${secondaryButtonClasses}`}
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setAuthMode('signup');
                    setAuthOpen(true);
                  }}
                  className={`rounded-2xl cursor-pointer px-4 py-3 text-center text-sm font-medium ${primaryButtonClasses}`}
                >
                  Sign up
                </button>
              </div>
            ) : (
              <div className={`mt-6 flex flex-col gap-3 border-t pt-4 ${shouldUseSolidBg ? 'border-gray-100' : 'border-white/20'}`}>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`rounded-2xl cursor-pointer border px-4 py-3 text-center text-sm font-medium ${secondaryButtonClasses}`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <LogOut size={16} />
                    Sign out
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <AuthModal
        isOpen={authOpen}
        onClose={() => {
          setAuthOpen(false);
          setAuthSuccessMessage('');
        }}
        initialMode={authMode}
        onSubmit={handleAuthSubmit}
        onGoogleAuth={handleGoogleAuth}
        onForgotPassword={() => {
          console.info('Forgot password flow triggered');
        }}
        successMessage={authSuccessMessage}
      />
    </>
  );

  return renderGuestNav();
};

export default Navbar;
