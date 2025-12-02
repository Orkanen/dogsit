export const getToken = () => {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
};

export const setToken = (token) => {
  localStorage.setItem("token", token);
  sessionStorage.removeItem("token"); // ensure only one place
};

export const clearToken = () => {
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
};

export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // exp is in seconds
    return !payload.exp || payload.exp < Date.now() / 1000;
  } catch {
    return true; // malformed → treat as expired
  }
};

export const ensureValidToken = () => {
  const token = getToken();

  if (!token || isTokenExpired(token)) {
    if (token) {
      console.info("[Auth] Invalid or expired token — clearing");
    }
    clearToken();
    localStorage.removeItem("user");
    return null;
  }

  return token;
};

// Optional: expose logout (used in multiple places)
export const logout = () => {
  clearToken();
  localStorage.removeItem("user");
  window.location.href = "/login";
};