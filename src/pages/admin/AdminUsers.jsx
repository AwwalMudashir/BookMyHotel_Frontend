import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import adminApi from '../../api/adminApi';
import authApi from '../../api/authApi';
import hotelApi from '../../api/hotelApi';
import toast from 'react-hot-toast';

const Avatar = ({ firstName, lastName }) => {
  const initials = `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF9F6] text-[#0A7C6E] font-semibold">{initials || '?'}</div>
  );
};

const RoleBadge = ({ role }) => {
  const classes = role === 'ADMIN' ? 'bg-[#EFF6FF] text-[#0B5FFF]' : 'bg-[#FFFBEB] text-[#B45309]';
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}>{role.replace('_', ' ')}</span>;
};

const UserCard = ({ user, onDelete }) => (
  <div className="flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-4">
    <Avatar firstName={user.firstName} lastName={user.lastName} />
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-sm">{user.firstName} {user.lastName}</div>
          <div className="text-xs text-slate-500">{user.email}</div>
        </div>
        <div className="text-right">
          <RoleBadge role={user.role} />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={() => onDelete(user.id)} className="cursor-pointer rounded-md bg-red-500 px-3 py-1 text-xs text-white">Remove</button>
      </div>
    </div>
  </div>
);

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [payload, setPayload] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'ADMIN', hotelId: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers();
      // Handle both old array format and new categorized format for backwards compatibility
      if (Array.isArray(res)) {
        setUsers(res);
      } else if (res && typeof res === 'object') {
        // New categorized format
        const allUsers = [];
        if (Array.isArray(res.admins)) allUsers.push(...res.admins);
        if (Array.isArray(res.hotelManagers)) allUsers.push(...res.hotelManagers);
        if (Array.isArray(res.customers)) allUsers.push(...res.customers);
        setUsers(res); // Store the categorized object
      } else {
        setUsers([]);
      }
    } catch (e) {
      toast.error('Unable to load users');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    hotelApi.getAllHotels(0, 100)
      .then((result) => setHotels(result.items || []))
      .catch(() => setHotels([]));
  }, []);

  const removeUser = async (id) => {
    if (!confirm('Remove this user?')) return;
    try {
      await adminApi.deleteUser(id);
      toast.success('User removed');
      load();
    } catch (e) { toast.error('Unable to remove user'); }
  };

  const validate = () => {
    if (!payload.firstName.trim()) { toast.error('First name required'); return false; }
    if (!payload.lastName.trim()) { toast.error('Last name required'); return false; }
    if (!payload.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) { toast.error('Valid email required'); return false; }
    if (!payload.password || payload.password.length < 6) { toast.error('Password must be at least 6 characters'); return false; }
    if (payload.role === 'HOTEL_MANAGER' && !payload.hotelId) { toast.error('Select the hotel this manager will manage'); return false; }
    return true;
  };

  const createUser = async () => {
    if (!validate()) return;
    setCreating(true);
    try {
      if (payload.role === 'ADMIN') {
        await authApi.registerAdmin(payload);
      } else {
        await authApi.registerHotelManager(payload);
      }
      toast.success('User created');
      setPayload({ firstName: '', lastName: '', email: '', password: '', role: 'ADMIN', hotelId: '' });
      setShowCreate(false);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Unable to create user');
    } finally { setCreating(false); }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#0A7C6E]">People</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">Users</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCreate(true)} className="cursor-pointer rounded-xl bg-[#0A7C6E] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#096D62]">+ Create user</button>
            <button onClick={load} className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">Refresh</button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {loading ? (
            <div className="rounded-lg bg-white p-6">Loading...</div>
          ) : (
            <>
              {/* Admins Section */}
              {Array.isArray(users.admins) && users.admins.length > 0 && (
                <div>
                  <h2 className="mb-3 text-sm font-semibold text-slate-700">Admins ({users.admins.length})</h2>
                  <div className="grid gap-3">
                    {users.admins.map((u) => <UserCard key={u.id} user={u} onDelete={removeUser} />)}
                  </div>
                </div>
              )}
              
              {/* Hotel Managers Section */}
              {Array.isArray(users.hotelManagers) && users.hotelManagers.length > 0 && (
                <div>
                  <h2 className="mb-3 text-sm font-semibold text-slate-700">Hotel Managers ({users.hotelManagers.length})</h2>
                  <div className="grid gap-3">
                    {users.hotelManagers.map((u) => <UserCard key={u.id} user={u} onDelete={removeUser} />)}
                  </div>
                </div>
              )}
              
              {/* Customers Section */}
              {Array.isArray(users.customers) && users.customers.length > 0 && (
                <div>
                  <h2 className="mb-3 text-sm font-semibold text-slate-700">Customers ({users.customers.length})</h2>
                  <div className="grid gap-3">
                    {users.customers.map((u) => <UserCard key={u.id} user={u} onDelete={removeUser} />)}
                  </div>
                </div>
              )}
              
              {/* Fallback for old array format */}
              {Array.isArray(users) && (
                <div className="grid gap-3">
                  {users.map((u) => <UserCard key={u.id} user={u} onDelete={removeUser} />)}
                </div>
              )}
              
              {/* Empty state */}
              {!Array.isArray(users) && (!users || Object.keys(users).length === 0) && (
                <div className="rounded-lg bg-white p-6 text-center text-slate-500">No users yet</div>
              )}
            </>
          )}
        </div>

        {/* Create user modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" onClick={() => setShowCreate(false)} />
            <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:max-h-[calc(100dvh-3rem)]">
              <div className="bg-gradient-to-r from-[#EAF7F5] via-[#F5FBFA] to-white px-6 py-5 sm:px-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#0A7C6E]">Team access</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">Create user</h2>
                  </div>
                  <button onClick={() => setShowCreate(false)} className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-lg text-slate-500 transition hover:border-slate-300 hover:text-slate-700">✕</button>
                </div>
              </div>

              <div className="space-y-5 p-6 sm:p-7">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">First name</span>
                    <input placeholder="Jane" value={payload.firstName} onChange={(e) => setPayload({ ...payload, firstName: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#0A7C6E]/60 focus:bg-white focus:ring-4 focus:ring-[#0A7C6E]/10" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">Last name</span>
                    <input placeholder="Doe" value={payload.lastName} onChange={(e) => setPayload({ ...payload, lastName: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#0A7C6E]/60 focus:bg-white focus:ring-4 focus:ring-[#0A7C6E]/10" />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Email address</span>
                  <input placeholder="jane@bookmyhotel.com" value={payload.email} onChange={(e) => setPayload({ ...payload, email: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#0A7C6E]/60 focus:bg-white focus:ring-4 focus:ring-[#0A7C6E]/10" />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Password</span>
                  <input placeholder="Create a secure password" type="password" value={payload.password} onChange={(e) => setPayload({ ...payload, password: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#0A7C6E]/60 focus:bg-white focus:ring-4 focus:ring-[#0A7C6E]/10" />
                </label>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Role</label>
                  <select value={payload.role} onChange={(e) => setPayload({ ...payload, role: e.target.value, hotelId: '' })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E]/60 focus:bg-white focus:ring-4 focus:ring-[#0A7C6E]/10">
                    <option value="ADMIN">Admin</option>
                    <option value="HOTEL_MANAGER">Hotel manager</option>
                  </select>
                </div>

                {payload.role === 'HOTEL_MANAGER' ? (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Managed hotel</label>
                    <select value={payload.hotelId} onChange={(e) => setPayload({ ...payload, hotelId: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E]/60 focus:bg-white focus:ring-4 focus:ring-[#0A7C6E]/10">
                      <option value="">Select a hotel</option>
                      {hotels.map((hotel) => (
                        <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                  <button onClick={() => setShowCreate(false)} className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Cancel</button>
                  <button onClick={createUser} disabled={creating} className="cursor-pointer rounded-xl bg-[#0A7C6E] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#096D62] disabled:cursor-not-allowed disabled:opacity-70">{creating ? 'Creating...' : 'Create user'}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
