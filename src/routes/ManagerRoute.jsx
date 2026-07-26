import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ManagerRoute = () => {
  const { role, isAuthenticated } = useAuth();
  // Allow HOTEL_MANAGER and ADMIN to access manager routes (admins may manage users across manager UI)
  return isAuthenticated && (role === 'HOTEL_MANAGER' || role === 'ADMIN') ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ManagerRoute;
