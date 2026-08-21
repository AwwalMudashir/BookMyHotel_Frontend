import { NavLink, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, BedDouble, Building2, CalendarDays, ChevronLeft, ConciergeBell, Leaf, LayoutDashboard, LogOut, MapPin, Tag, Users, X } from 'lucide-react';
import authApi from '../../api/authApi';
import { AUTH_STORAGE_KEYS } from '../../utils/constants';

const AdminSidebar = ({ collapsed, mobileOpen = false, onCloseMobile = () => {}, onToggle }) => {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      const refreshToken = window.localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken) || window.sessionStorage.getItem(AUTH_STORAGE_KEYS.refreshToken);
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // ignore logout API errors
    }
    // clear local storage/session and dispatch global logout event
    try {
      window.localStorage.removeItem(AUTH_STORAGE_KEYS.token);
      window.localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
      window.sessionStorage.removeItem(AUTH_STORAGE_KEYS.token);
      window.sessionStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
    } catch {
      // Storage may be unavailable in privacy-restricted browsers.
    }
    window.dispatchEvent(new Event('auth:logout'));
    navigate('/');
  };

  const getNavLinkClassName = ({ isActive }) => `group flex items-center gap-2 rounded-xl px-2 py-2 text-xs transition ${isActive ? 'bg-[#0A7C6E] text-white shadow-sm' : 'text-[#374151] hover:bg-slate-100 hover:text-slate-900'}`;
  const getNavIconClassName = (isActive) => `flex h-9 w-9 items-center justify-center rounded-lg ${isActive ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'}`;

  return (
    <>
    {mobileOpen ? <button type="button" onClick={onCloseMobile} aria-label="Close admin navigation" className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" /> : null}
    <aside className={`fixed top-0 left-0 z-50 bottom-0 flex h-screen w-72 flex-col bg-white border-r border-slate-200 px-5 transition-all duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${collapsed ? 'lg:w-28 lg:px-3' : 'lg:w-72 lg:px-5'}`} aria-hidden={false}>
      <div className="flex items-center justify-between gap-2 py-3">
        <div className={`flex items-center gap-2 ${collapsed ? 'justify-center w-full' : ''}`}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0A7C6E] text-white shadow-sm">
            <Building2 size={18} />
          </div>
          {!collapsed && (
            <div>
              <div className="text-base font-semibold text-slate-900">BookMyHotel</div>
              <div className="text-xs text-slate-500">Admin dashboard</div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 lg:inline-flex"
        >
          <ChevronLeft size={16} className={`${collapsed ? 'rotate-180' : ''} transition-transform`} />
        </button>
        <button type="button" onClick={onCloseMobile} className="rounded-lg p-2 text-slate-500 lg:hidden" aria-label="Close admin navigation"><X size={18} /></button>
      </div>

      <nav onClick={onCloseMobile} className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5">
          <li>
            <NavLink to="/admin/dashboard" title={collapsed ? 'Dashboard' : undefined} className={getNavLinkClassName}>
              {({ isActive }) => (
                <>
                  <span className={getNavIconClassName(isActive)}>
                    <LayoutDashboard size={18} />
                  </span>
                  {!collapsed && 'Dashboard'}
                </>
              )}
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/hotels" title={collapsed ? 'Hotels' : undefined} className={getNavLinkClassName}>
              {({ isActive }) => (
                <>
                  <span className={getNavIconClassName(isActive)}>
                    <Building2 size={18} />
                  </span>
                  {!collapsed && 'Hotels'}
                </>
              )}
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/branches" title={collapsed ? 'Branches' : undefined} className={getNavLinkClassName}>
              {({ isActive }) => (
                <>
                  <span className={getNavIconClassName(isActive)}>
                    <MapPin size={18} />
                  </span>
                  {!collapsed && 'Branches'}
                </>
              )}
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/rooms" title={collapsed ? 'Rooms' : undefined} className={getNavLinkClassName}>
              {({ isActive }) => (
                <>
                  <span className={getNavIconClassName(isActive)}>
                    <BedDouble size={18} />
                  </span>
                  {!collapsed && 'Rooms'}
                </>
              )}
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/reservations" title={collapsed ? 'Reservations' : undefined} className={getNavLinkClassName}>
              {({ isActive }) => (
                <>
                  <span className={getNavIconClassName(isActive)}>
                    <CalendarDays size={18} />
                  </span>
                  {!collapsed && 'Reservations'}
                </>
              )}
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/promotions" title={collapsed ? 'Promotions' : undefined} className={getNavLinkClassName}>
              {({ isActive }) => (
                <>
                  <span className={getNavIconClassName(isActive)}>
                    <Tag size={18} />
                  </span>
                  {!collapsed && 'Promotions'}
                </>
              )}
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/services" title={collapsed ? 'Services' : undefined} className={getNavLinkClassName}>
              {({ isActive }) => (
                <>
                  <span className={getNavIconClassName(isActive)}>
                    <ConciergeBell size={18} />
                  </span>
                  {!collapsed && 'Services'}
                </>
              )}
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/users" title={collapsed ? 'Users' : undefined} className={getNavLinkClassName}>
              {({ isActive }) => (
                <>
                  <span className={getNavIconClassName(isActive)}>
                    <Users size={18} />
                  </span>
                  {!collapsed && 'Users'}
                </>
              )}
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/sustainability-tags" title={collapsed ? 'Sustainability tags' : undefined} className={getNavLinkClassName}>
              {({ isActive }) => (
                <>
                  <span className={getNavIconClassName(isActive)}><Leaf size={18} /></span>
                  {!collapsed && 'Sustainability tags'}
                </>
              )}
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="mt-auto space-y-3 py-4">
        <button
          type="button"
          onClick={() => { window.location.href = '/'; }}
          title={collapsed ? 'Return to website' : undefined}
        className={`flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-[#0A7C6E] transition hover:bg-slate-50 ${collapsed ? 'justify-center' : 'justify-start'}`}
        >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ECFDF6] text-[#0A7C6E]">
          <ArrowLeftRight size={16} />
          </div>
          {!collapsed && 'Return to website'}
        </button>
        <button
          type="button"
          onClick={logout}
          title={collapsed ? 'Logout' : undefined}
          className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 text-xs font-semibold text-white shadow-sm transition ${collapsed ? 'justify-center bg-[#ef4444]' : 'justify-start bg-[#ef4444] hover:bg-[#dc2626]'}`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#991B1B]/10 text-white">
            <LogOut size={16} />
          </div>
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
    </>
  );
};

export default AdminSidebar;
