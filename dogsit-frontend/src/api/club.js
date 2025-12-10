import fetchPublic from "./fetchPublic";
import fetchWithAuth from "./fetchWithAuth";

const clubApi = {
  // Public
  listClubs: () => fetchPublic("/club"),
  getClubById: (id) => fetchPublic(`/club/${id}`),

  // Protected
  getMyClubs: () => fetchWithAuth("/club/my"),
  createClub: (data) => fetchWithAuth("/club", { method: "POST", body: JSON.stringify(data) }),
  joinClub: (clubId, message) => fetchWithAuth(`/club/${clubId}/join`, { method: "POST", body: JSON.stringify({ message }) }),
  getClubRequests: (clubId) => fetchWithAuth(`/club/${clubId}/requests`),
  acceptMember: (clubId, userId) => fetchWithAuth(`/club/requests/members/${clubId}/${userId}/accept`, { method: "PATCH" }),
  rejectMember: (clubId, userId) => fetchWithAuth(`/club/requests/members/${clubId}/${userId}/reject`, { method: "PATCH" }),

  // NEW: THE ONLY ONES YOU NEED
  getManagedData: async () => {
    return await fetchWithAuth("/me/managed");  // ← fetchWithAuth already returns parsed JSON
  },

  getMyManagedClubs: async () => {
    return await fetchWithAuth("/me/clubs");
  },

  nominateCertifier: (clubId, userId) =>
    fetchWithAuth(`/clubs/${clubId}/certifier`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
};

export default clubApi;