import PromotionManager from '../../components/promotion/PromotionManager';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout from '../../components/admin/AdminLayout';

// Purpose: Hotel-manager promotion management for their own hotel only. Mirrors
// ManagerServices — an ADMIN reaching this route (ManagerRoute allows both roles) is pointed
// at /admin/promotions instead, since that screen already covers any hotel.
const ManagerPromotions = () => {
  const { user, role } = useAuth();
  const managedHotelId = user?.managedHotel?.id;

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Property promotions</p>
          <h1 className="mt-2 font-[Playfair_Display] text-3xl font-semibold text-[#1A1A2E]">Promotions</h1>
          <p className="mt-2 text-sm text-[#6B7280]">Create, edit, and deactivate discount codes for your hotel.</p>
        </div>

        {role !== 'HOTEL_MANAGER' ? (
          <div className="rounded-[28px] bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-[#6B7280]">Admins manage promotions from the admin dashboard instead.</p>
          </div>
        ) : !managedHotelId ? (
          <div className="rounded-[28px] bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-[#6B7280]">Your account isn't assigned to manage a hotel yet — contact an administrator to get set up.</p>
          </div>
        ) : (
          <div className="rounded-[28px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
            <PromotionManager hotelId={managedHotelId} />
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ManagerPromotions;
