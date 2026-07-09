import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminRoute = () => {
  const { role, isAuthenticated } = useAuth();
  return isAuthenticated && role === 'ADMIN' ? <Outlet /> : <Navigate to="/login" replace />;
};

export default AdminRoute;
