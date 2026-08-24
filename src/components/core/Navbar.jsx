import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Hotel, Compass, Gift, Mail, Menu, Sparkles, X, LogIn, LogOut, UserCircle, LayoutGrid, Leaf } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthModal from './AuthModal';
import CurrencySwitcher from './CurrencySwitcher';
import { useAuth } from '../../hooks/useAuth';
import { AUTH_STORAGE_KEYS } from '../../utils/constants';

const guestLinks = [
  { to: '/hotels', label: 'Hotels', icon: Hotel },
  { to: '/search', label: 'Activities', icon: Compass },
  { to: '/packages', label: 'Packages', icon: Gift },
  { to: '/contact', label: 'Contact', icon: Mail },
];

const linkBaseClasses = 'flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[13px] font-medium transition-colors';

const Navbar = ({ variant = 'default', initialAuthMode = null }) => {
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
  const [authOpen, setAuthOpen] = useState(() => Boolean(initialAuthMode) && !isAuthenticated);
  const [authMode, setAuthMode] = useState(initialAuthMode || 'login');
  const [authSuccessMessage, setAuthSuccessMessage] = useState('');
  const authTransitionTimer = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (!authOpen && authTransitionTimer.current) {
      clearTimeout(authTransitionTimer.current);
      authTransitionTimer.current = null;
      setAuthSuccessMessage('');
    }
  }, [authOpen]);

  useEffect(() => {
    return () => {
      if (authTransitionTimer.current) {
        clearTimeout(authTransitionTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleAuthRequired = () => {
      setAuthSuccessMessage('');
      setAuthMode('login');
      setAuthOpen(true);
    };

    window.addEventListener('auth:required', handleAuthRequired);
    return () => window.removeEventListener('auth:required', handleAuthRequired);
  }, []);

  useEffect(() => {
    if (!initialAuthMode || isAuthenticated) return;

    try {
      const notice = window.sessionStorage.getItem(AUTH_STORAGE_KEYS.sessionNotice);
      if (notice) {
        window.sessionStorage.removeItem(AUTH_STORAGE_KEYS.sessionNotice);
        toast.error(notice, { id: 'session-expired', duration: 4000 });
      }
    } catch {
      // The login modal remains available if storage is restricted.
    }
  }, [initialAuthMode, isAuthenticated]);

  const isHomeRoute = location.pathname === '/';
  const isHeroVariant = variant === 'hero' || isHomeRoute;
  const shouldUseTransparentBg = isHeroVariant && !isScrolled;
  const shouldUseSolidBg = isScrolled || (!isHeroVariant && !shouldUseTransparentBg);

  const shellClasses = shouldUseSolidBg
    ? 'border-gray-100 bg-white/80 text-slate-900 shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl'
    : 'border-transparent bg-transparent text-white';

  const navContainerClasses = 'fixed inset-x-0 top-0 z-[60] transition-all duration-300';

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
        setAuthOpen(false);
        redirectByRole(roleName);
      } catch (error) {
        // Display the backend error message from response body
        const errorMessage = error?.message || 'Unable to sign in. Please try again.';
        toast.error(errorMessage);
        // Keep auth modal open so user can retry
      }
      return;
    }

    try {
      if (authTransitionTimer.current) {
        clearTimeout(authTransitionTimer.current);
      }
      const response = await registerUser({ firstName, lastName, email, password });

      // Some backends return HTTP 200 with { success: false, message: '...' } — treat that as an error
      if (response && response.success === false) {
        const errorMessage = response.message || 'Unable to create your account.';
        toast.error(errorMessage);
        return;
      }

      // If registerUser returned something that looks like an error (no payload and no message), fail safe
      if (!response || (typeof response === 'object' && Object.keys(response).length === 0)) {
        toast.error('Unable to create your account. Please try again.');
        return;
      }

      const successMsg = response?.message || 'Account created successfully. You can now sign in.';
      setAuthSuccessMessage(successMsg);
      toast.success(successMsg);

      // Wait a moment so the user can read the success message, then show the login form
      authTransitionTimer.current = window.setTimeout(() => {
        setAuthMode('login');
      }, 1000);
    } catch (error) {
      // Display the backend error message from response body
      const errorMessage = error?.message || 'Unable to create your account.';
      toast.error(errorMessage);
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
              <LayoutGrid size={15} />
              <span>Bookings</span>
            </NavLink>
            <NavLink to="/profile" className={linkClasses}>
              <UserCircle size={15} />
              <span>Profile</span>
            </NavLink>
          </>
        )}
        {role !== 'CUSTOMER' && (
          <NavLink to={dashboardPath} className={linkClasses}>
            <LayoutGrid size={15} />
            <span>Dashboard</span>
          </NavLink>
        )}
      </>
    );
  };

  const renderGuestNav = () => (
    <>
      <nav className={`h-14 transition-all duration-300 md:h-16 ${navContainerClasses} ${shellClasses}`}>
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-7">
          <NavLink to="/" className="flex items-center gap-2">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full ${iconBadgeClasses}`}>
              <Sparkles size={18} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-[Playfair_Display] text-lg font-semibold">BookMyHotel</span>
              <span className={`text-[11px] ${shouldUseSolidBg ? 'text-gray-500' : 'text-white/70'}`}>Stay beautifully</span>
            </div>
          </NavLink>

          <div className="hidden items-center gap-0.5 lg:flex">
            {guestLinks.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={linkClasses}>
                <Icon size={15} />
                <span>{label}</span>
              </NavLink>
            ))}
            {isAuthenticated && renderAuthenticatedActions()}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <CurrencySwitcher buttonClassName={secondaryButtonClasses} />
            </div>
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
                  className={`hidden cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition sm:inline-flex ${secondaryButtonClasses}`}
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
                    setAuthSuccessMessage('');
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
                    setAuthSuccessMessage('');
                    setAuthMode('signup');
                    setAuthOpen(true);
                  }}
                  className={`hidden cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition sm:inline-flex ${primaryButtonClasses}`}
                >
                  <LogIn size={16} />
                  Sign up
                </button>
              </>
            )}

            <button
              type="button"
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition lg:hidden ${secondaryButtonClasses}`}
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-60 bg-black/30 lg:hidden" onClick={() => setMobileOpen(false)}>
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

            <div className={`mt-4 flex items-center justify-between rounded-2xl border px-3 py-2 sm:hidden ${shouldUseSolidBg ? 'border-gray-100 bg-gray-50' : 'border-white/20 bg-white/10'}`}>
              <span className="text-sm font-medium">Display currency</span>
              <CurrencySwitcher buttonClassName={secondaryButtonClasses} />
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
          if (initialAuthMode) {
            navigate('/', { replace: true });
          }
        }}
        initialMode={authMode}
        onSubmit={handleAuthSubmit}
        onGoogleAuth={handleGoogleAuth}
        successMessage={authSuccessMessage}
      />
    </>
  );

  return renderGuestNav();
};

export default Navbar;
