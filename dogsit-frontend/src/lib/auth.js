export const getToken = () => localStorage.getItem('token');

export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; 
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};