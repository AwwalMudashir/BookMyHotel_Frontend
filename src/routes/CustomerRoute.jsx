import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const CustomerRoute = () => {
  const { role, isAuthenticated } = useAuth();
  return isAuthenticated && role === 'CUSTOMER' ? <Outlet /> : <Navigate to="/login" replace />;
};

export default CustomerRoute;
