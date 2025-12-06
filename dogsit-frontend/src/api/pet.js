import fetchPublic from "./fetchPublic";
import fetchWithAuth from "./fetchWithAuth";

const petApi = {
  // PUBLIC
  getPetById: (id) => fetchPublic(`/pet/${id}`),

  // PROTECTED
  getMyPets: async () => {
    const res = await fetchWithAuth("/pet/my");
    return res; // or res.pets if you wrap it
  },

  createPet: (data) =>
    fetchWithAuth("/pet", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updatePet: (id, data) =>
    fetchWithAuth(`/pet/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deletePet: (id) => fetchWithAuth(`/pet/${id}`, { method: "DELETE" }),
};

export default petApi;