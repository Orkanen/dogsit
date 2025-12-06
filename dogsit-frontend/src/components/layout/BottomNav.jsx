import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import "@/styles/components/_bottom-nav.scss";

export default function BottomNav() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  if (loading) return null;

  // Helper: exact or startsWith match
  const isActive = (target) => {
    if (target === "/") return path === "/";
    if (target.includes("/profile/")) return path.startsWith("/profile/");
    return path.startsWith(target);
  };

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {/* Always visible */}
      <NavLink
        to="/"
        className={() => `bottom-nav__item ${isActive("/") ? "bottom-nav__item--active" : ""}`}
        end
      >
        Home
      </NavLink>

      <NavLink
        to="/kennel"
        className={() => `bottom-nav__item ${isActive("/kennel") ? "bottom-nav__item--active" : ""}`}
      >
        Kennels
      </NavLink>

      <NavLink
        to="/clubs"
        className={() => `bottom-nav__item ${isActive("/clubs") ? "bottom-nav__item--active" : ""}`}
      >
        Club
      </NavLink>

      {/* Auth-dependent */}
      {user ? (
        <>
          <NavLink
            to="/matches"
            className={() => `bottom-nav__item ${isActive("/matches") ? "bottom-nav__item--active" : ""}`}
          >
            Matches
          </NavLink>

          <NavLink
            to="/chat"
            className={() => `bottom-nav__item ${isActive("/chat") ? "bottom-nav__item--active" : ""}`}
          >
            Chat
          </NavLink>

          <NavLink
            to={`/profile/${user.id}`}
            className={() => `bottom-nav__item ${isActive("/profile/") ? "bottom-nav__item--active" : ""}`}
          >
            Profile
          </NavLink>

          <NavLink
            to="/pets/my"
            className={() => `bottom-nav__item ${isActive("/pets/my") ? "bottom-nav__item--active" : ""}`}
          >
            My Pets
          </NavLink>

          <button
            onClick={logout}
            className="bottom-nav__item bottom-nav__item--logout"
            aria-label="Log out"
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <NavLink
            to="/login"
            className={() => `bottom-nav__item ${isActive("/login") ? "bottom-nav__item--active" : ""}`}
          >
            Login
          </NavLink>

          <NavLink
            to="/register"
            className={() => `bottom-nav__item ${isActive("/register") ? "bottom-nav__item--active" : ""}`}
          >
            Register
          </NavLink>
        </>
      )}
    </nav>
  );
}