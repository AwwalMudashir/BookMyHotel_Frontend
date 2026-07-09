import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ManagerRoute = () => {
  const { role, isAuthenticated } = useAuth();
  return isAuthenticated && role === 'HOTEL_MANAGER' ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ManagerRoute;
