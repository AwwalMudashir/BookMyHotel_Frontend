import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/core/Spinner';

const CustomerRoute = () => {
  const { role, isAuthenticated, isHydrated } = useAuth();

  // Wait for session restore before deciding — see ProtectedRoute.
  if (!isHydrated) {
    return <div className="flex justify-center py-16"><Spinner /></div>;
  }

  return isAuthenticated && role === 'CUSTOMER' ? <Outlet /> : <Navigate to="/login" replace />;
};

export default CustomerRoute;
