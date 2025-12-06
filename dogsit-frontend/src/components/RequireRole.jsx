import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function RequireRole({ children, roles = [] }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length === 0) {
    return children;
  }

  const userRoles = (user?.roles || []).map(r => 
    typeof r === "string" ? r.toLowerCase() : r?.toLowerCase() || ""
  );

  const hasRequiredRole = roles.some(required => {
    const req = required.toLowerCase();

    if (req === "kennel") {
      return userRoles.includes("kennel") || userRoles.includes("owner");
    }
    if (req === "club") {
      return userRoles.includes("club") || userRoles.includes("owner");
    }

    return userRoles.includes(req);
  });

  if (!hasRequiredRole) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}