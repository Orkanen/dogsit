import fetchPublic from "./fetchPublic";
import fetchWithAuth from "./fetchWithAuth";

const petApi = {
  // PUBLIC
  getPetById: (id) => fetchPublic(`/pets/${id}`),

  // PROTECTED
  getMyPets: async () => {
    const res = await fetchWithAuth("/pets/my");
    return res;
  },

  createPet: (data) =>
    fetchWithAuth("/pets", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updatePet: (id, data) =>
    fetchWithAuth(`/pets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deletePet: (id) => fetchWithAuth(`/pets/${id}`, { method: "DELETE" }),

  attachImage: (id, imageId) =>
    fetchWithAuth(`/pets/${id}/image`, {
      method: "POST",
      body: JSON.stringify({ imageId }),
    }),

  // NOTE: Kennel verification request is in kennelApi.requestPetLink
};

export default petApi;