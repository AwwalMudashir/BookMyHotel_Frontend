import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/hotels', label: 'Hotels' },
  { to: '/admin/branches', label: 'Branches' },
  { to: '/admin/rooms', label: 'Rooms' },
  { to: '/admin/reservations', label: 'Reservations' },
  { to: '/admin/promotions', label: 'Promotions' },
];

// Purpose: Shared tab strip so the admin screens can actually navigate between each other —
// the main Navbar only links to a single "Dashboard" entry point.
const AdminNav = () => (
  <div className="mb-6 inline-flex flex-wrap gap-1 rounded-2xl border border-[#E5E7EB] bg-white p-1 shadow-sm">
    {tabs.map(({ to, label }) => (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) =>
          `rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            isActive ? 'bg-[#0A7C6E] text-white' : 'text-[#6B7280] hover:text-[#0A7C6E]'
          }`
        }
      >
        {label}
      </NavLink>
    ))}
  </div>
);

export default AdminNav;
