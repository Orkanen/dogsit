import authApi from "./auth";
import clubApi from "./club";
import competitionsApi from "./competitions";
import coursesApi from "./courses";
import kennelApi from "./kennel";
import matchApi from "./match";
import messageApi from "./message";
import petApi from "./pet";
import profileApi from "./profile";
import sitterApi from "./sitter";

const api = {
  auth: authApi,
  club: clubApi,
  competitions: competitionsApi,
  courses: coursesApi,
  kennel: kennelApi,
  match: matchApi,
  message: messageApi,
  pet: petApi,
  profile: profileApi,
  sitter: sitterApi,
};

export default api;