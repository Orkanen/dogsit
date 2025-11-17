// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { getToken, isTokenExpired } from "../lib/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate on mount
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

  const login = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}