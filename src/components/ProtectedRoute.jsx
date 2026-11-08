import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FullPageSpinner } from './Spinner';

export function ProtectedRoute() {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();
  if (initializing) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

export function GuestRoute() {
  const { isAuthenticated, initializing } = useAuth();
  if (initializing) return <FullPageSpinner />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
}
