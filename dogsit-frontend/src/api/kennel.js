import { ensureValidToken } from "@/lib/auth";

const API_BASE = import.meta.env.VITE_API_BASE

const handleResponse = async (res) => {
    const data = await res.json().catch(() => ({}));

    if (res.status === 401 || res.status === 403) {
      return null;
    }
  
    if (!res.ok) {
      throw new Error(data.error || data.message || `HTTP ${res.status}`);
    }
  
    return data;
};

const getAuthHeaders = () => {
    const token = ensureValidToken();
    if (!token) return null;

    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.trim()}`,
    };
};

const kennelApi = {
    // KENNELS
    getKennels: () => fetch(`${API_BASE}/kennel`, { headers: { "Content-Type": "application/json" } }).then(handleResponse),
    getKennelById: (id) => fetch(`${API_BASE}/kennel/${id}`, { headers: { "Content-Type": "application/json" } }).then(handleResponse),

    getMyKennels: async () => {
        const headers = getAuthHeaders();
        if (!headers) return []; // ← no valid token → silent empty
      
        try {
          const res = await fetch(`${API_BASE}/kennel/my`, { headers });
      
          if (res.status === 401 || res.status === 403) return []; // normal
          if (!res.ok) {
            if (res.status === 400) console.warn("[API] 400 on /kennel/my — possible server issue");
            if (res.status >= 500) console.error("[API] Server error on /kennel/my");
            return [];
          }
      
          return await res.json();
        } catch (err) {
          console.error("[API] Network error:", err);
          return [];
        }
    },

    getKennelRequests: () =>
    fetch(`${API_BASE}/kennel/requests`, {
        headers: getAuthHeaders(),
    }).then(handleResponse),

    acceptKennelRequest: (reqId) =>
    fetch(`${API_BASE}/kennel/requests/${reqId}/accept`, {
        method: "PATCH",
        headers: getAuthHeaders(),
    }).then(handleResponse),

    rejectKennelRequest: (reqId) =>
    fetch(`${API_BASE}/kennel/requests/${reqId}/reject`, {
        method: "PATCH",
        headers: getAuthHeaders(),
    }).then(handleResponse),
    
    createKennel: (data) =>
    fetch(`${API_BASE}/kennel`, {
        method: "POST",
        headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    }).then(handleResponse),

    requestKennelMembership: (kennelId, message = "") =>
    fetch(`${API_BASE}/kennel/${kennelId}/request-membership`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
    }).then(handleResponse),

    requestPetLink: (kennelId, petId, message = "") =>
    fetch(`${API_BASE}/kennel/${kennelId}/request-pet`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ petId, message }),
    }).then(handleResponse),
}

export default kennelApi
