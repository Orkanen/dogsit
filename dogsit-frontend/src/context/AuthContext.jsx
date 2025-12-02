import { createContext, useContext, useState, useEffect } from "react";
import { ensureValidToken, logout } from "@/lib/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      const token = ensureValidToken(); // ← validates + auto-clears bad token
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          console.warn("[Auth] Corrupted user data in localStorage");
          logout();
        }
      } else {
        // No valid token → ensure clean state
        setUser(null);
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logoutUser = () => {
    logout(); // uses shared logout from lib/auth
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout: logoutUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);