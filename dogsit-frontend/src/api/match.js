import fetchPublic from "./fetchPublic";
import fetchWithAuth from "./fetchWithAuth";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const matchApi = {
  // MATCHES
  getMatches: () => fetchWithAuth(`/match`, { method: "GET" }),

  createMatch: (sitterId) =>
    fetchWithAuth(`/match`, {
      method: "POST",
      body: JSON.stringify({ sitterId }),
    }),

  // ACCEPT
  acceptMatch: (matchId) =>
    fetchWithAuth(`/match/${matchId}/accept`, {
      method: "PATCH",
    }),

  // REJECT
  rejectMatch: (matchId) =>
    fetchWithAuth(`/match/${matchId}/reject`, {
      method: "PATCH",
    }),

  // CANCEL
  cancelMatch: (matchId) =>
    fetchWithAuth(`/match/${matchId}`, {
      method: "DELETE",
    }),
};

export default matchApi;