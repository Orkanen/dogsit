import fetchWithAuth from "./fetchWithAuth";

const coursesApi = {
  create: (data) =>
  fetchWithAuth("/courses", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (id, data) =>
    fetchWithAuth(`/courses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    fetchWithAuth(`/courses/${id}`, {
      method: "DELETE",
    }),

  toggleHidden: (id) =>
    fetchWithAuth(`/courses/${id}/hidden`, {
      method: "PATCH",
    }),

  setAvailable: (id, available, reason = null) =>
    fetchWithAuth(`/courses/${id}/available`, {
      method: "PATCH",
      body: JSON.stringify({ available, reason }),
    }),

  assignTrainer: (courseId, userId) =>
    fetchWithAuth(`/courses/${courseId}/trainer`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  removeTrainer: (courseId, userId) =>
    fetchWithAuth(`/courses/${courseId}/trainer/${userId}`, {
      method: "DELETE",
    }),

  getMyIssuableCourses: () =>
    fetchWithAuth("/courses/my/issuable"),
};

export default coursesApi;