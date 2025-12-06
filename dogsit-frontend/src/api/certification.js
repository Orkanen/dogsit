import fetchPublic from "./fetchPublic";
import fetchWithAuth from "./fetchWithAuth";

const certificationApi = {
  // Request a new certification
  requestCertification: async (data) =>
    fetchWithAuth("/certifications", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Get courses this user can issue certificates for
  getMyIssuableCourses: async () =>
    fetchWithAuth("/courses/my-issuable"),

  // Get pending certification requests (for club/kennel admins)
  getPendingCertifications: async () =>
    fetchWithAuth("/certifications/pending"),

  // Verify/approve a certification
  verifyCertification: async (id) =>
    fetchWithAuth(`/certifications/${id}/verify`, {
      method: "PATCH",
    }),

  // Reject a certification
  rejectCertification: async (id, reason = "") =>
    fetchWithAuth(`/certifications/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),
};

export default certificationApi;