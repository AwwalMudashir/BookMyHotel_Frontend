import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/core/Spinner';

const ManagerRoute = () => {
  const { role, isAuthenticated, isHydrated } = useAuth();

  // Wait for session restore before deciding — see ProtectedRoute.
  if (!isHydrated) {
    return <div className="flex justify-center py-16"><Spinner /></div>;
  }

  // Allow HOTEL_MANAGER and ADMIN to access manager routes (admins may manage users across manager UI)
  return isAuthenticated && (role === 'HOTEL_MANAGER' || role === 'ADMIN') ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ManagerRoute;
