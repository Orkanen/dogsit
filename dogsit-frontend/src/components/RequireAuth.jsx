import { Navigate, useLocation } from 'react-router-dom';
import { getToken, isTokenExpired } from '../lib/auth';

export default function RequireAuth({ children }) {
  const token = getToken();
  const location = useLocation();

  if (!token || isTokenExpired(token)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}