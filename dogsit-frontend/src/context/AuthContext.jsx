// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import api from "@/api";  // ← Make sure this is "@/api" not "../api"

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on app start
  const loadUserFromStorage = () => {
    try {
      const userJson = localStorage.getItem("user");
      if (userJson) {
        setUser(JSON.parse(userJson));
      }
    } catch (err) {
      console.error("Failed to load user from storage", err);
    } finally {
      setLoading(false);
    }
  };

  // Manual login with token + user (used after register/login)
  const loginWithToken = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  // Email/password login
  const login = async (email, password) => {
    const { token, user: userData } = await api.auth.login(email, password);
    loginWithToken(token, userData);
    return userData;
  };

  // Register + auto-login
  const register = async (email, password, roleNames = ["sitter"]) => {
    const { token, user: userData } = await api.auth.register(email, password, roleNames);
    loginWithToken(token, userData);
    return userData;
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const hasRole = (role) => user?.roles?.includes(role) ?? false;
  const isAuthenticated = !!user;

  // Load user on mount
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading,
        isAuthenticated,
        hasRole,
        loginWithToken, // optional: expose if needed
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);