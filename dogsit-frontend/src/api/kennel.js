import fetchPublic from "./fetchPublic";
import fetchWithAuth from "./fetchWithAuth";

const kennelApi = {
  // PUBLIC
  getKennels: () => fetchPublic("/kennel"),
  getKennelById: (id) => fetchPublic(`/kennel/${id}`),

  // PROTECTED
  getManagedData: () => fetchWithAuth("/kennel/my/managed"),
  getMyKennels: () => fetchWithAuth("/kennel/my"),
  getRequests: () => fetchWithAuth("/kennel/requests"),

  createKennel: (data) =>
    fetchWithAuth("/kennel", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  acceptRequest: (reqId) =>
    fetchWithAuth(`/kennel/requests/${reqId}/accept`, { method: "PATCH" }),

  rejectRequest: (reqId) =>
    fetchWithAuth(`/kennel/requests/${reqId}/reject`, { method: "PATCH" }),

  removePetVerification: (petId) =>
    fetchWithAuth(`/kennel/pet/${petId}/remove-verification`, { method: "POST" }),

  revokeVerification: (reqId, reason) =>
    fetchWithAuth(`/kennel/requests/${reqId}/revoke`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  requestPetLink: (kennelId, petId, message) =>
    fetchWithAuth(`/kennel/${kennelId}/request-pet`, {
      method: "POST",
      body: JSON.stringify({ petId, message }),
    }),
};

export default kennelApi;