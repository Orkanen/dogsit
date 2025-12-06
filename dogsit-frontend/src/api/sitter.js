import fetchPublic from "./fetchPublic";

const sitterApi = {
  // ← PUBLIC — async so you can await it
  getSitters: async () => {
    const res = await fetchPublic("/sitters");
    return res; // or res.sitters if your backend wraps it
  },

  getSitterById: async (id) => {
    const res = await fetchPublic(`/sitters/${id}`);
    return res;
  },
};

export default sitterApi;