import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import HomePage from '../pages/public/HomePage';
import HotelListPage from '../pages/public/HotelListPage';
import HotelDetailPage from '../pages/public/HotelDetailPage';
import RoomDetailPage from '../pages/public/RoomDetailPage';
import SearchPage from '../pages/public/SearchPage';
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';
import ContactPage from '../pages/public/ContactPage';
import BookingFlowPage from '../pages/customer/BookingFlowPage';
import PaymentPage from '../pages/customer/PaymentPage';
import MyBookingsPage from '../pages/customer/MyBookingsPage';
import ProfilePage from '../pages/customer/ProfilePage';
import ReviewPage from '../pages/customer/ReviewPage';
import ManagerDashboard from '../pages/manager/ManagerDashboard';
import ManagerProperty from '../pages/manager/ManagerProperty';
import ManagerRates from '../pages/manager/ManagerRates';
import ManagerAvailability from '../pages/manager/ManagerAvailability';
import ManagerServices from '../pages/manager/ManagerServices';
import ManagerOpportunities from '../pages/manager/ManagerOpportunities';
import ManagerReservations from '../pages/manager/ManagerReservations';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminHotels from '../pages/admin/AdminHotels';
import AdminBranches from '../pages/admin/AdminBranches';
import AdminRooms from '../pages/admin/AdminRooms';
import AdminReservations from '../pages/admin/AdminReservations';
import AdminPromotions from '../pages/admin/AdminPromotions';
import AdminHotelReport from '../pages/admin/AdminHotelReport';
import ProtectedRoute from './ProtectedRoute';
import CustomerRoute from './CustomerRoute';
import ManagerRoute from './ManagerRoute';
import AdminRoute from './AdminRoute';

const AppRouter = () => {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/hotels" element={<HotelListPage />} />
        <Route path="/hotels/:id" element={<HotelDetailPage />} />
        <Route path="/rooms/:id" element={<RoomDetailPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/contact" element={<ContactPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/booking" element={<BookingFlowPage />} />
          <Route path="/payment" element={<PaymentPage />} />
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
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/hotels" element={<AdminHotels />} />
          <Route path="/admin/branches" element={<AdminBranches />} />
          <Route path="/admin/rooms" element={<AdminRooms />} />
          <Route path="/admin/reservations" element={<AdminReservations />} />
          <Route path="/admin/promotions" element={<AdminPromotions />} />
          <Route path="/admin/reports/:hotelId" element={<AdminHotelReport />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
