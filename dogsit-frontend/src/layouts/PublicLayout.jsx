import { Outlet } from "react-router-dom";
import BottomNav from "../components/layout/BottomNav";

export default function PublicLayout() {
  return (
    <div style={{ minHeight: "100vh", paddingBottom: "4rem" }}>
      <main>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}