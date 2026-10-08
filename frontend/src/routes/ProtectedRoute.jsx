import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";

export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading label="Loading your dashboard..." />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  const userRole = (user.role || "").toLowerCase();
  const targetRole = (role || "").toLowerCase();

  if (targetRole && userRole !== targetRole) {
    return <Navigate to={`/${userRole}/dashboard`} replace />;
  }

  return children;
}
