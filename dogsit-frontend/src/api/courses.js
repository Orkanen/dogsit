import fetchPublic from "./fetchPublic";
import fetchWithAuth from "./fetchWithAuth";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const coursesApi = {
  getMyIssuableCourses: async () => {
    return fetchWithAuth(`/club/my`, { method: "GET" });
  },

  createCourse: async (data) =>
    fetchWithAuth(`/courses`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCourse: async (id, data) =>
    fetchWithAuth(`/courses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  nominateCourseCertifier: (courseId, { userId, clubId } = {}) =>
    fetchWithAuth(`/club-certifier`, {
      method: "POST",
      body: JSON.stringify({ clubId, userId, courseId }),
    }),

  deleteCourse: (id) => fetchWithAuth(`/courses/${id}`, { method: "DELETE" }),
};

export default coursesApi;