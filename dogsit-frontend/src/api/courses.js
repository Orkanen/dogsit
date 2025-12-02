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

const coursesApi = {
  // Get all courses user can see (for dashboard)
  getMyCourses: () =>
    fetch(`${API_BASE}/courses/my`, {
      headers: getAuthHeaders(),
    }).then(handleResponse),

  // Create a new course (kennel/club owner)
  createCourse: (data) =>
    fetch(`${API_BASE}/courses`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  // Update course
  updateCourse: (id, data) =>
    fetch(`${API_BASE}/courses/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),
};

export default coursesApi;