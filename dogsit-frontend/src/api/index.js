import kennelApi from './kennel';
import petApi from './pet';
import matchApi from './match';
import imageApi from './image';
import authApi from './auth';
import sitterApi from './sitter';
import profileApi from './profile';
import messageApi from './message';
import certificationApi from './certification';   // ← NEW
import coursesApi from './courses';               // ← NEW

const api = {
  ...kennelApi,
  ...authApi,
  ...petApi,
  ...matchApi,
  ...imageApi,
  ...sitterApi,
  ...profileApi,
  ...messageApi,
  ...certificationApi,
  ...coursesApi,
};

export default api;