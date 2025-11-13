import { Link } from "react-router-dom";
import { useAuth } from "../hooks/auth";

const linkStyle = {
  flex: 1,
  textAlign: "center",
  padding: "0.75rem 0",
  color: "#6b7280",
  fontSize: "0.875rem",
  fontWeight: "500",
  textDecoration: "none",
};
const activeStyle = { ...linkStyle, color: "#1d4ed8", borderTop: "2px solid #1d4ed8" };

export default function BottomNav() {
    const { user, loading, logout } = useAuth()
    const currentPath = window.location.pathname;
  

    if (loading) return null;

    const handleLogout = () => {
    logout()
    }

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "white",
        borderTop: "1px solid #e5e7eb",
        display: "flex",
        boxShadow: "0 -1px 3px rgba(0,0,0,0.1)",
        zIndex: 1000,
      }}
    >
      {/* ALWAYS VISIBLE */}
      <Link to="/" style={currentPath === "/" ? activeStyle : linkStyle}>
        Home
      </Link>
      <Link to="/kennels" style={currentPath.startsWith("/kennels") ? activeStyle : linkStyle}>
        Kennels
      </Link>

      {/* LOGGED IN → PRIVATE TABS */}
      {user ? (
        <>
        <Link to="/matches" style={currentPath.startsWith("/matches") ? activeStyle : linkStyle}>
            Matches
        </Link>
        <Link to="/chat" style={currentPath.startsWith("/chat") ? activeStyle : linkStyle}>
            Chat
        </Link>
        <Link to={`/profile/${user.id}`} style={currentPath.startsWith(`/profile/${user.id}`) ? activeStyle : linkStyle}>
            Profile
        </Link>
        <Link to="/pets/my" style={currentPath.startsWith("/pets/my") ? activeStyle : linkStyle}>
            My Pets
        </Link>
            <button
            onClick={handleLogout}
            style={{ ...linkStyle, color: "#dc2626", borderTop: "none" }}
            >
            Logout
            </button>
        </>
      ) : (
        <>
          <Link to="/login" style={currentPath === "/login" ? activeStyle : linkStyle}>
            Login
          </Link>
          <Link to="/register" style={currentPath === "/register" ? activeStyle : linkStyle}>
            Register
          </Link>
        </>
      )}
    </nav>
  );
}