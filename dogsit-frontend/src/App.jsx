import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import Matches from './components/Matches';
import Sitters from './components/Sitters';
import Kennels from './components/Kennels';
import KennelDetail from './pages/KennelDetail';

// Token Helper
const getToken = () => localStorage.getItem('token');
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// Auth Guard
function RequireAuth({ children }) {
  const token = getToken();
  if (!token || isTokenExpired(token)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// PROTECTED ROUTES
function ProtectedLayout() {
  return (
    <>
      <Routes>
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/sitters" element={<Sitters />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/kennels" element={<Kennels />} />
      <Route path="/kennel/:id" element={<KennelDetail />} />

      {/* PROTECTED */}
      <Route
        path="/*"
        element={
          <RequireAuth>
            <ProtectedLayout />
          </RequireAuth>
        }
      />
    </Routes>
  );
}