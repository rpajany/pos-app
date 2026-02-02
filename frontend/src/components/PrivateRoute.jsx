import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/context/useAuth";

const PrivateRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1. Show nothing (or a spinner) while checking authentication
  if (loading) {
    return <div>Loading...</div>; // Replace with a proper Spinner component
  }

  // 2. If no user is logged in, redirect to login
  // We save the 'from' location so we can send them back after they log in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. If user exists, render the child routes
  return <Outlet />;
};

export default PrivateRoute;
