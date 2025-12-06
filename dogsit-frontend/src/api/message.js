import fetchPublic from "./fetchPublic";
import fetchWithAuth from "./fetchWithAuth";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const messageApi = {
  // MESSAGES
  getMessages: (matchId) => fetchWithAuth(`/message/${matchId}`, { method: "GET" }),
};

export default messageApi;