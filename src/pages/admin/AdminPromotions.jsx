import { useEffect, useState } from 'react';
import Navbar from '../../components/core/Navbar';
import AdminNav from '../../components/admin/AdminNav';
import PromotionManager from '../../components/promotion/PromotionManager';
import hotelApi from '../../api/hotelApi';
import Spinner from '../../components/core/Spinner';

// Purpose: Admin platform promotion management page — an admin can target any hotel,
// unlike a hotel manager who is locked to their own (see ManagerPromotions).
const AdminPromotions = () => {
  const [hotels, setHotels] = useState([]);
  const [hotelsLoading, setHotelsLoading] = useState(true);
  const [selectedHotelId, setSelectedHotelId] = useState('');

  useEffect(() => {
    let cancelled = false;
    hotelApi.getAllHotels(1, 100)
      .then(({ items }) => {
        if (cancelled) return;
        setHotels(items);
        if (items.length > 0) setSelectedHotelId(String(items[0].id));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setHotelsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A2E]">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <AdminNav />

        <div className="mb-6">
          <h1 className="font-[Playfair_Display] text-2xl font-semibold">Promotions</h1>
          <p className="mt-1 text-sm text-[#6B7280]">Create, edit, and deactivate discount codes for any hotel.</p>
        </div>

        {hotelsLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : hotels.length === 0 ? (
          <div className="rounded-[24px] bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-[#6B7280]">No hotels exist yet — add one first.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Hotel</label>
              <select
                value={selectedHotelId}
                onChange={(event) => setSelectedHotelId(event.target.value)}
                className="w-full max-w-xs rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
              >
                {hotels.map((hotel) => (
                  <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
                ))}
              </select>
            </div>

            <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <PromotionManager hotelId={selectedHotelId ? Number(selectedHotelId) : null} />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminPromotions;
