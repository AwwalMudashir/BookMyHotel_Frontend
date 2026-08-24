import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import ManagerRoute from './ManagerRoute';
import AdminRoute from './AdminRoute';

const HomePage = lazy(() => import('../pages/public/HomePage'));
const HotelListPage = lazy(() => import('../pages/public/HotelListPage'));
const HotelDetailPage = lazy(() => import('../pages/public/HotelDetailPage'));
const RoomDetailPage = lazy(() => import('../pages/public/RoomDetailPage'));
const SearchPage = lazy(() => import('../pages/public/SearchPage'));
const ContactPage = lazy(() => import('../pages/public/ContactPage'));
const PackagesPage = lazy(() => import('../pages/public/PackagesPage'));
const BookingFlowPage = lazy(() => import('../pages/customer/BookingFlowPage'));
const PaymentPage = lazy(() => import('../pages/customer/PaymentPage'));
const PaymentReturnPage = lazy(() => import('../pages/customer/PaymentReturnPage'));
const MyBookingsPage = lazy(() => import('../pages/customer/MyBookingsPage'));
const ProfilePage = lazy(() => import('../pages/customer/ProfilePage'));
const ReviewPage = lazy(() => import('../pages/customer/ReviewPage'));
const ManagerDashboard = lazy(() => import('../pages/manager/ManagerDashboard'));
const ManagerProperty = lazy(() => import('../pages/manager/ManagerProperty'));
const ManagerRates = lazy(() => import('../pages/manager/ManagerRates'));
const ManagerAvailability = lazy(() => import('../pages/manager/ManagerAvailability'));
const ManagerServices = lazy(() => import('../pages/manager/ManagerServices'));
const ManagerOpportunities = lazy(() => import('../pages/manager/ManagerOpportunities'));
const ManagerReservations = lazy(() => import('../pages/manager/ManagerReservations'));
const ManagerPromotions = lazy(() => import('../pages/manager/ManagerPromotions'));
const ManagerSustainabilityTags = lazy(() => import('../pages/manager/ManagerSustainabilityTags'));
const ManagerPackages = lazy(() => import('../pages/manager/ManagerPackages'));
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminHotels = lazy(() => import('../pages/admin/AdminHotels'));
const AdminBranches = lazy(() => import('../pages/admin/AdminBranches'));
const AdminRooms = lazy(() => import('../pages/admin/AdminRooms'));
const AdminReservations = lazy(() => import('../pages/admin/AdminReservations'));
const AdminPromotions = lazy(() => import('../pages/admin/AdminPromotions'));
const AdminServices = lazy(() => import('../pages/admin/AdminServices'));
const AdminHotelReport = lazy(() => import('../pages/admin/AdminHotelReport'));
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'));
const AdminSustainabilityTags = lazy(() => import('../pages/admin/AdminSustainabilityTags'));
const AdminPackages = lazy(() => import('../pages/admin/AdminPackages'));

const PageFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]" role="status" aria-live="polite">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0A7C6E]/20 border-t-[#0A7C6E]" />
    <span className="sr-only">Loading page</span>
  </div>
);

const AppRouter = () => (
  <BrowserRouter>
    <Suspense fallback={<PageFallback />}>
      <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/hotels" element={<HotelListPage />} />
      <Route path="/hotels/:id" element={<HotelDetailPage />} />
      <Route path="/rooms/:id" element={<RoomDetailPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/login" element={<HomePage key="login" initialAuthMode="login" />} />
      <Route path="/register" element={<HomePage key="register" initialAuthMode="signup" />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/packages" element={<PackagesPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/booking" element={<BookingFlowPage />} />
          <Route path="/payment/:bookingId" element={<PaymentPage />} />
          <Route path="/bookings/:bookingId/payment-return" element={<PaymentReturnPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/review/:branchId" element={<ReviewPage />} />
        </Route>

        <Route element={<ManagerRoute />}>
          <Route path="/manager/dashboard" element={<ManagerDashboard />} />
          <Route path="/manager/property" element={<ManagerProperty />} />
          <Route path="/manager/rates" element={<ManagerRates />} />
          <Route path="/manager/availability" element={<ManagerAvailability />} />
          <Route path="/manager/services" element={<ManagerServices />} />
          <Route path="/manager/opportunities" element={<ManagerOpportunities />} />
          <Route path="/manager/reservations" element={<ManagerReservations />} />
          <Route path="/manager/promotions" element={<ManagerPromotions />} />
          <Route path="/manager/sustainability-tags" element={<ManagerSustainabilityTags />} />
          <Route path="/manager/packages" element={<ManagerPackages />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/hotels" element={<AdminHotels />} />
          <Route path="/admin/branches" element={<AdminBranches />} />
          <Route path="/admin/rooms" element={<AdminRooms />} />
          <Route path="/admin/reservations" element={<AdminReservations />} />
          <Route path="/admin/promotions" element={<AdminPromotions />} />
          <Route path="/admin/services" element={<AdminServices />} />
          <Route path="/admin/sustainability-tags" element={<AdminSustainabilityTags />} />
          <Route path="/admin/packages" element={<AdminPackages />} />
          <Route path="/admin/reports/:hotelId" element={<AdminHotelReport />} />
          <Route path="/admin/users" element={<AdminUsers />} />
        </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default AppRouter;
