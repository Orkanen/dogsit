export default function getAuthHeaders() {
  if (typeof window === "undefined") return {};
  
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}