import fetchPublic from "./fetchPublic";
import fetchWithAuth from "./fetchWithAuth";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const kennelApi = {
  getKennels: () => fetchPublic("/kennel"),

  getKennelById: (id) => fetchPublic(`/kennel/${id}`),

  getMyKennels: async () => {
    try {
      const data = await fetchWithAuth(`/kennel/my`);
      return Array.isArray(data) ? data : data || [];
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) return [];
      console.error("[kennelApi] getMyKennels error:", err);
      return [];
    }
  },

  getKennelRequests: () => fetchWithAuth(`/kennel/requests`),

  acceptKennelRequest: (requestId) =>
    fetchWithAuth(`/kennel/requests/${requestId}/accept`, { method: "PATCH" }),

  rejectKennelRequest: (requestId) =>
    fetchWithAuth(`/kennel/requests/${requestId}/reject`, { method: "PATCH" }),

  createKennel: (data) =>
    fetchWithAuth(`/kennel`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  requestKennelMembership: (kennelId, message = "") =>
    fetchWithAuth(`/kennel/${kennelId}/request-membership`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  requestPetLink: (kennelId, petId, message = "") =>
    fetchWithAuth(`/kennel/${kennelId}/request-pet`, {
      method: "POST",
      body: JSON.stringify({ petId, message }),
    }),

  revokePetVerification: (requestId, reason = "") =>
    fetchWithAuth(`/kennel/requests/${requestId}/revoke`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  removePetVerification: (petId) =>
    fetchWithAuth(`/kennel/pet/${petId}/remove-verification`, {
      method: "POST",
    }),
};

export default kennelApi;