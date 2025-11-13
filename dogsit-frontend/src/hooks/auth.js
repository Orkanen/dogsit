import { useState, useEffect } from "react";
import { getToken, isTokenExpired } from "../lib/auth";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate token & user on mount
  useEffect(() => {
    const validate = () => {
      const token = getToken();
      const storedUser = localStorage.getItem("user");

      if (!token || isTokenExpired(token) || !storedUser) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      } else {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
      }
      setLoading(false);
    };

    validate();
  }, []);

  // Manual login (call from Login component)
  const login = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  // Manual logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  };

  return { user, loading, login, logout };
}