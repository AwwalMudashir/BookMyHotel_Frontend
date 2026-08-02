import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/core/Spinner';

const ProtectedRoute = () => {
  const { isAuthenticated, isHydrated } = useAuth();

  // Session restore (and any token refresh it triggers) is async — redirecting
  // before it settles bounces users off their own pages on a page reload.
  if (!isHydrated) {
    return <div className="flex justify-center py-16"><Spinner /></div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
