import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/core/Spinner';

const ManagerRoute = () => {
  const { role, isAuthenticated, isHydrated } = useAuth();

  // Wait for session restore before deciding — see ProtectedRoute.
  if (!isHydrated) {
    return <div className="flex justify-center py-16"><Spinner /></div>;
  }

  return isAuthenticated && role === 'HOTEL_MANAGER' ? <Outlet /> : <Navigate to="/" replace />;
};

export default ManagerRoute;
