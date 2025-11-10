import { Outlet, Navigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

export default function ProtectedLayout() {
  const token = localStorage.getItem("token");
  if (!token) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return <Navigate to="/login" replace />;
    }
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "4rem" }}>
      <main>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}