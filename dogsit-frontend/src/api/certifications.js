import fetchWithAuth from "./fetchWithAuth";

const certificationsApi = {
    // Request certificate (pet owner)
    request: (data) =>
        fetchWithAuth("/certifications", {
        method: "POST",
        body: JSON.stringify(data),
        }),

    // Get pending requests (club dashboard)
    getPending: () => fetchWithAuth("/certifications/pending"),

    // Approve a pending request
    verify: (certId) =>
        fetchWithAuth(`/certifications/${certId}/verify`, {
        method: "PATCH",
        }),

    // Reject a pending request (with optional notes)
    reject: (certId, notes = null) =>
        fetchWithAuth(`/certifications/${certId}/reject`, {
        method: "PATCH",
        body: notes ? JSON.stringify({ notes }) : undefined,
        }),

    getForPet: (petId) =>
        fetchWithAuth(`/certifications?petId=${petId}`),
};

export default certificationsApi;