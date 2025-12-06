import fetchPublic from "./fetchPublic";
import fetchWithAuth from "./fetchWithAuth";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const enrollmentsApi = {
  // Apply/enroll for a course
  // data: { courseId, targetType: "PET"|"USER", targetId }
  applyForCourse: (data) =>
    fetchWithAuth(`${API_BASE}/enrollment`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Process an enrollment (approve/reject) by club owner/employee or kennel owner
  processEnrollment: (id, action, notes) =>
    fetchWithAuth(`${API_BASE}/enrollment/${id}/process`, {
      method: "PATCH",
      body: JSON.stringify({ action, notes }),
    }),
};

export default enrollmentsApi;