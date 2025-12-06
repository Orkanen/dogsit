import fetchPublic from "./fetchPublic";
import fetchWithAuth from "./fetchWithAuth";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const clubCertifierApi = {
  nominateCertifier: (data) =>
    fetchWithAuth(`/club-certifier`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listMyNominations: () =>
    fetchWithAuth(`/club-certifier/my`, { method: "GET" }),

  approveNomination: (id) =>
    fetchWithAuth(`/club-certifier/${id}/approve`, { method: "PATCH" }),

  rejectNomination: (id) =>
    fetchWithAuth(`/club-certifier/${id}/reject`, { method: "PATCH" }),
};

export default clubCertifierApi;