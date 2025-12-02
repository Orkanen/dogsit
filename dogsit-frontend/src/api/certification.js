const API_BASE = import.meta.env.VITE_API_BASE;

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || "Request failed");
  }
  return data;
};

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const certificationApi = {
  // Request a certification from pet profile
  requestCertification: (data) =>
    fetch(`${API_BASE}/certifications`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  // Get courses user can request (from kennels/clubs they're in)
  getMyIssuableCourses: () =>
    fetch(`${API_BASE}/courses/my-issuable`, {
      headers: getAuthHeaders(),
    }).then(handleResponse),

  // Dashboard: pending certifications to approve/reject
  getPendingCertifications: () =>
    fetch(`${API_BASE}/certifications/pending`, {
      headers: getAuthHeaders(),
    }).then(handleResponse),

  // Approve / Reject
  approveCertification: (id) =>
    fetch(`${API_BASE}/certifications/${id}/approve`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    }).then(handleResponse),

  rejectCertification: (id) =>
    fetch(`${API_BASE}/certifications/${id}/reject`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    }).then(handleResponse),
};

export default certificationApi;