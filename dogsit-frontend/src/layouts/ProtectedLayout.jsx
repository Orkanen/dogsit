import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BottomNav from "../components/layout/BottomNav";

export default function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "4rem" }}>
      <main>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}