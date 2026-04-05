import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute - guards routes by authentication and role.
 * Props:
 *  - allowedRoles: array of roles (e.g., ['admin', 'owner'])
 *  - requireApproved: owner must be approved
 */
export default function ProtectedRoute({ allowedRoles = [], requireApproved = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requireApproved && user.role === 'owner' && user.isApproved !== 'approved') {
    return <Navigate to="/pending-approval" replace />;
  }

  return <Outlet />;
}
