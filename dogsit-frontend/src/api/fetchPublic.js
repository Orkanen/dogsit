const API_BASE = import.meta.env.VITE_API_BASE || "";

export default function fetchPublic(url, options = {}) {
  return fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  }).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}