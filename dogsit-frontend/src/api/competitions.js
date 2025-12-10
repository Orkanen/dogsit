import fetchWithAuth from "./fetchWithAuth";

const competitionsApi = {
  update: (id, data) =>
  fetchWithAuth(`/competition/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),

delete: (id) =>
  fetchWithAuth(`/competition/${id}`, {
    method: "DELETE",
  }),

toggleHidden: (id) =>
  fetchWithAuth(`/competition/${id}/hidden`, {
    method: "PATCH",
  }),

setAvailable: (id, available, reason = null) =>
  fetchWithAuth(`/competition/${id}/available`, {
    method: "PATCH",
    body: JSON.stringify({ available, reason }),
  }),

nominateAwarder: (competitionId, userId) =>
  fetchWithAuth(`/competition/${competitionId}/awarder`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  }),

processAwarder: (competitionId, userId, action) =>
  fetchWithAuth(`/competition/${competitionId}/awarder/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ action }),
  }),
};

export default competitionsApi;