import fetchPublic from "./fetchPublic";
import fetchWithAuth from "./fetchWithAuth";

const profileApi = {
  getProfile: async () => {
    return fetchWithAuth("/profile");
  },

  updateProfile: async (data) => {
    return fetchWithAuth("/profile", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateUserRoles: async (roles) => {
    return fetchWithAuth("/profile/roles", {
      method: "PATCH",
      body: JSON.stringify({ roles }),
    });
  },
};

export default profileApi;