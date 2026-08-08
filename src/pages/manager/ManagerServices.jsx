import ServiceManager from '../../components/manager/ServiceManager';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout from '../../components/admin/AdminLayout';

// Purpose: Manager ancillary service management page. Only ever renders the create-service
// tool for a HOTEL_MANAGER whose account has a managedHotel assigned — anyone else (including
// an ADMIN who can otherwise reach manager routes) sees an explanatory message instead, since
// the backend has no hotel context to create a service against for them anyway.
const ManagerServices = () => {
  const { user, role } = useAuth();
  const managedHotelId = user?.managedHotel?.id;

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Property services</p>
          <h1 className="mt-2 font-[Playfair_Display] text-3xl font-semibold text-[#1A1A2E]">Add a service</h1>
          <p className="mt-2 text-sm text-[#6B7280]">Create bar, restaurant, car hire, spa, or tour add-ons guests can book alongside a room.</p>
        </div>

        {role !== 'HOTEL_MANAGER' ? (
          <div className="rounded-[28px] bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-[#6B7280]">This screen is only available to hotel managers.</p>
          </div>
        ) : !managedHotelId ? (
          <div className="rounded-[28px] bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-[#6B7280]">Your account isn't assigned to manage a hotel yet — contact an administrator to get set up.</p>
          </div>
        ) : (
          <ServiceManager hotelId={managedHotelId} />
        )}
      </div>
    </AdminLayout>
  );
};

export default ManagerServices;
