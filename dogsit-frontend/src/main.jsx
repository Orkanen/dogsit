import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import App from './App.jsx'

let navigateRef = null;

const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const res = await originalFetch(...args);
  if (res.status === 401) {
    localStorage.removeItem('token');
    if (navigateRef) {
      navigateRef('/login', { replace: true });
    } else {
      window.location.href = '/login';
    }
  }
  return res;
};

function Root() {
  const navigate = useNavigate();
  navigateRef = navigate;
  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </StrictMode>,
)
