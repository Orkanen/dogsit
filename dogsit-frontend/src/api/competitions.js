import fetchPublic from "./fetchPublic";
import fetchWithAuth from "./fetchWithAuth";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const competitionsApi = {
  createCompetition: (data) =>
    fetchWithAuth(`/competition`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  applyCompetition: (competitionId, data) =>
    fetchWithAuth(`/competition/${competitionId}/apply`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  assignCompetitionAward: (competitionId, data) =>
    fetchWithAuth(`/competition/${competitionId}/award`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  processEntry: (competitionId, entryId, action, notes) =>
    fetchWithAuth(`/competition/${competitionId}/entries/${entryId}/process`, {
      method: "PATCH",
      body: JSON.stringify({ action, notes }),
    }),

  nominateAwarder: (competitionId, userId) =>
    fetchWithAuth(`/competition/${competitionId}/awarders`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  listAwarders: (competitionId, status) =>
    fetchWithAuth(
      `/competition/${competitionId}/awarders${status ? `?status=${encodeURIComponent(status)}` : ""}`,
      { method: "GET" }
    ),

  approveAwarder: (competitionId, userId) =>
    fetchWithAuth(`/competition/${competitionId}/awarders/${userId}/approve`, {
      method: "PATCH",
    }),

  rejectAwarder: (competitionId, userId, notes) =>
    fetchWithAuth(`/competition/${competitionId}/awarders/${userId}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ notes }),
    }),

  // convenience wrapper for club-certifier route (kept for back-compat)
  nominateCompetitionCertifier: (competitionId, { userId, clubId } = {}) =>
    fetchWithAuth(`/club-certifier`, {
      method: "POST",
      body: JSON.stringify({ clubId, userId, competitionId }),
    }),

  deleteCompetition: (id) => fetchWithAuth(`/competitions/${id}`, { method: "DELETE" }),
};

export default competitionsApi;