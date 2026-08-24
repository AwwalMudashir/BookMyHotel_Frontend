import { NavLink, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, BedDouble, Building2, CalendarDays, ChevronLeft, ConciergeBell, Gift, Leaf, LayoutDashboard, LogOut, Tag, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const links = [
  { to: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/manager/property', label: 'Property', icon: Building2 },
  { to: '/manager/rates', label: 'Rooms & rates', icon: BedDouble },
  { to: '/manager/availability', label: 'Availability', icon: CalendarDays },
  { to: '/manager/reservations', label: 'Reservations', icon: CalendarDays },
  { to: '/manager/services', label: 'Services', icon: ConciergeBell },
  { to: '/manager/promotions', label: 'Promotions', icon: Tag },
  { to: '/manager/packages', label: 'Off-season packages', icon: Gift },
  { to: '/manager/sustainability-tags', label: 'Sustainability tags', icon: Leaf },
];

const ManagerSidebar = ({ collapsed, mobileOpen, onToggle, onCloseMobile }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const hotelName = user?.managedHotel?.name || 'Assigned hotel';
  const linkClass = ({ isActive }) => `group flex items-center gap-2 rounded-xl px-2 py-2 text-xs transition ${isActive ? 'bg-[#0A7C6E] text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      {mobileOpen ? <button type="button" aria-label="Close navigation" onClick={onCloseMobile} className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" /> : null}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ${collapsed ? 'lg:w-28 lg:px-3' : 'lg:w-72 lg:px-5'} w-72 px-5 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between gap-2 py-4">
          <div className={`flex min-w-0 items-center gap-2 ${collapsed ? 'lg:justify-center lg:w-full' : ''}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0A7C6E] text-white"><Building2 size={18} /></div>
            <div className={`${collapsed ? 'lg:hidden' : ''} min-w-0`}>
              <div className="font-semibold text-slate-900">BookMyHotel</div>
              <div className="truncate text-xs text-slate-500">{hotelName}</div>
            </div>
          </div>
          <button type="button" onClick={onCloseMobile} className="rounded-lg p-2 text-slate-500 lg:hidden"><X size={18} /></button>
          <button type="button" onClick={onToggle} className="hidden h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 lg:inline-flex"><ChevronLeft size={16} className={collapsed ? 'rotate-180' : ''} /></button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          <ul className="space-y-1">
            {links.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink to={to} onClick={onCloseMobile} title={collapsed ? label : undefined} className={linkClass}>
                  {({ isActive }) => <><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isActive ? 'bg-white/15' : 'bg-slate-100'}`}><Icon size={18} /></span><span className={collapsed ? 'lg:hidden' : ''}>{label}</span></>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-2 py-4">
          <button type="button" onClick={() => navigate('/')} className="flex w-full items-center gap-2 rounded-xl border border-slate-200 px-2 py-2 text-xs font-semibold text-[#0A7C6E]"><span className="flex h-8 w-8 items-center justify-center"><ArrowLeftRight size={16} /></span><span className={collapsed ? 'lg:hidden' : ''}>Return to website</span></button>
          <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl bg-red-500 px-2 py-2 text-xs font-semibold text-white"><span className="flex h-8 w-8 items-center justify-center"><LogOut size={16} /></span><span className={collapsed ? 'lg:hidden' : ''}>Logout</span></button>
        </div>
      </aside>
    </>
  );
};

export default ManagerSidebar;
