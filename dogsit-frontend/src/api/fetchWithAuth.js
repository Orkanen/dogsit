import getAuthHeaders from "./getAuthHeaders";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export default async function fetchWithAuth(input, init = {}) {
  const url = typeof input === "string" ? `${API_BASE}${input}` : input.url;
  const authHeaders = getAuthHeaders();

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(init.headers || {}),
    },
  });

  if (response.status === 401) {
    // Token is invalid/expired → silently log the user out
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    const err = new Error("Session expired");
    err.status = 401;
    throw err;
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.error || data?.message || `HTTP ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}