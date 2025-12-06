// src/api/auth.js
import getAuthHeaders from "./getAuthHeaders";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const handleResponse = async (res) => {
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message = data?.error || data?.message || "Request failed";
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
};

const authApi = {
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });

    const data = await handleResponse(res);

    const token = data.token;
    const user = data.user;

    if (token && user) {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    }

    return { token, user };
  },

  register: async (email, password, roleNames = ["sitter"]) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        roleNames,
      }),
    });

    const data = await handleResponse(res);

    const token = data.token;
    const user = data.user;

    if (token && user) {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    }

    return { token, user };
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getCurrentUser: () => {
    try {
      const userJson = localStorage.getItem("user");
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  },
};

export default authApi;