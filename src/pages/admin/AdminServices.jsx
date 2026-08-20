import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import ServiceManager from '../../components/manager/ServiceManager';
import Spinner from '../../components/core/Spinner';
import hotelApi from '../../api/hotelApi';

const AdminServices = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotelId, setSelectedHotelId] = useState('');

  useEffect(() => {
    let cancelled = false;
    hotelApi.getAllHotels(1, 100)
      .then(({ items }) => {
        if (cancelled) return;
        setHotels(items);
        setSelectedHotelId(items[0] ? String(items[0].id) : '');
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Guest add-ons</p>
          <h1 className="mt-2 font-[Playfair_Display] text-3xl font-semibold text-[#1A1A2E]">Hotel services</h1>
          <p className="mt-2 text-sm text-[#6B7280]">Create, update, or remove services for any hotel and choose where each one is offered.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : hotels.length === 0 ? (
          <div className="rounded-[28px] bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-[#6B7280]">No hotels exist yet — add one first.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Hotel</label>
              <select value={selectedHotelId} onChange={(event) => setSelectedHotelId(event.target.value)} className="w-full max-w-sm rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15">
                {hotels.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.name}</option>)}
              </select>
            </div>
            <ServiceManager key={selectedHotelId} hotelId={Number(selectedHotelId)} />
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminServices;
