import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const ProtectedRoute = ({ roles = [] }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center text-gray-500">Loading...</div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles.length && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
};

export default ProtectedRoute;
