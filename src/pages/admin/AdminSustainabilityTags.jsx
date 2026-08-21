import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import SustainabilityTagManager from '../../components/manager/SustainabilityTagManager';
import hotelApi from '../../api/hotelApi';

const AdminSustainabilityTags = () => {
  const [hotels, setHotels] = useState([]);
  const [hotelId, setHotelId] = useState('');
  useEffect(() => { hotelApi.getAllHotels(1, 100).then(({ items }) => { setHotels(items); if (items[0]) setHotelId(String(items[0].id)); }).catch(() => setHotels([])); }, []);
  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0A7C6E]">Sustainability</p><h1 className="mt-2 font-[Playfair_Display] text-3xl font-semibold">Sustainability tags</h1><p className="mt-1 text-sm text-slate-500">Manage hotel-wide and branch-specific sustainability badges.</p></div><label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Hotel<select value={hotelId} onChange={(event) => setHotelId(event.target.value)} className="mt-1 block min-w-56 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-900">{hotels.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.name}</option>)}</select></label></div>
        <SustainabilityTagManager hotelId={hotelId} />
      </div>
    </AdminLayout>
  );
};
export default AdminSustainabilityTags;
