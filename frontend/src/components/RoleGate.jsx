import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from "@/context/useAuth";

const RoleGate = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading permissions...</div>;

  // 1. If not logged in, send to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Check if the user's role is in the allowed list
  const hasAccess = allowedRoles.includes(user.role);

  // 3. If they don't have access, send to an "Unauthorized" page or Dashboard
  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default RoleGate;