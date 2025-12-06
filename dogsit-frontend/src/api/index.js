import authApi from "./auth";
import clubApi from "./club";
import certificationApi from "./certification";
import clubCertifierApi from "./clubCertifier";
import competitionsApi from "./competitions";
import coursesApi from "./courses";
import enrollmentsApi from "./enrollments";
import kennelApi from "./kennel";
import matchApi from "./match";
import messageApi from "./message";
import petApi from "./pet";
import profileApi from "./profile";
import sitterApi from "./sitter";

const api = {
  auth: authApi,
  club: clubApi,
  certification: certificationApi,
  clubCertifier: clubCertifierApi,
  competitions: competitionsApi,
  courses: coursesApi,
  enrollments: enrollmentsApi,
  kennel: kennelApi,
  match: matchApi,
  message: messageApi,
  pet: petApi,
  profile: profileApi,
  sitter: sitterApi,
};

export default api;