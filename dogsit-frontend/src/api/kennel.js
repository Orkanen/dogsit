import { ensureValidToken } from "@/lib/auth";

const API_BASE = import.meta.env.VITE_API_BASE;

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));

  // Silently return null on auth errors — caller decides what to do
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
    // PUBLIC — Anyone can see kennels
    getKennels: () =>
        fetch(`${API_BASE}/kennel`).then(handleResponse),

    getKennelById: (id) =>
        fetch(`${API_BASE}/kennel/${id}`).then(handleResponse),

    // AUTH — Your kennels (quiet fail → empty array if not logged in)
    getMyKennels: async () => {
        const headers = getAuthHeaders();
        if (!headers) return [];

        try {
        const res = await fetch(`${API_BASE}/kennel/my`, { headers });
        if (res.status === 401 || res.status === 403) return [];
        if (!res.ok) return [];
        return await res.json();
        } catch (err) {
        console.error("[kennelApi] getMyKennels error:", err);
        return [];
        }
    },

    // UNIFIED REQUESTS INBOX — Both membership + pet verification requests
    getKennelRequests: () =>
        fetch(`${API_BASE}/kennel/requests`, {
        headers: getAuthHeaders(),
        }).then(handleResponse),

    // Accept any request (membership or pet link)
    acceptKennelRequest: (requestId) =>
        fetch(`${API_BASE}/kennel/requests/${requestId}/accept`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        }).then(handleResponse),

    // Reject any request
    rejectKennelRequest: (requestId) =>
        fetch(`${API_BASE}/kennel/requests/${requestId}/reject`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        }).then(handleResponse),

    // CREATE KENNEL
    createKennel: (data) =>
        fetch(`${API_BASE}/kennel`, {
        method: "POST",
        headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        }).then(handleResponse),

    // REQUEST TO JOIN A KENNEL
    requestKennelMembership: (kennelId, message = "") =>
        fetch(`${API_BASE}/kennel/${kennelId}/request-membership`, {
        method: "POST",
        headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
        }).then(handleResponse),

    // REQUEST PET VERIFICATION FROM A KENNEL (this is the one you wanted!)
    requestPetLink: (kennelId, petId, message = "") =>
        fetch(`${API_BASE}/kennel/${kennelId}/request-pet`, {
        method: "POST",
        headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ petId, message }),
        }).then(handleResponse),

    getKennelPetRequests: async () => {
        const headers = getAuthHeaders();
        if (!headers) return [];
        
        try {
            const requests = await fetch(`${API_BASE}/kennel/requests`, { headers }).then(handleResponse);
            return (requests || []).filter(r => r.type === "PET_LINK");
        } catch (err) {
            console.error("[kennelApi] getKennelPetRequests error:", err);
            return [];
        }
        },
    getMyOutgoingPetVerificationRequests: async () => {
        const headers = getAuthHeaders();
        if (!headers) return [];
        
        try {
            const allRequests = await fetch(`${API_BASE}/kennel/requests`, { headers }).then(handleResponse);
            return (allRequests || []).filter(r => 
            r.type === "PET_LINK" && 
            r.pet?.ownerId === headers["userId"] // or however you store current user ID
            // Alternative: compare r.pet.owner.email === user.email if you have user in context
            );
        } catch (err) {
            console.error("[kennelApi] getMyOutgoingPetVerificationRequests error:", err);
            return [];
        }
        },

    revokePetVerification: (requestId, reason = "") =>
        fetch(`${API_BASE}/kennel/requests/${requestId}/revoke`, {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
        }).then(handleResponse),

    removePetVerification: (petId) =>
        fetch(`${API_BASE}/kennel/pet/${petId}/remove-verification`, {
          method: "POST",
          headers: getAuthHeaders(),
        }).then(handleResponse),
};

export default kennelApi;