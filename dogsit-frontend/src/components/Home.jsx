import { Link } from 'react-router-dom'

const linkStyle = { color: '#1d4ed8', textDecoration: 'underline', fontWeight: '500' }

export default function Home() {
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Dog/Sit</h1>
      <p>Frontend is running.</p>

      {user ? (
        <div style={{ margin: '1rem 0', padding: '1rem', background: '#f0fdfa', borderRadius: '8px' }}>
          <p><strong>Logged in as:</strong> {user.email} ({user.role})</p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <Link to={`/profile/${user.id}`} style={linkStyle}>Edit Profile</Link>
            <button onClick={handleLogout} style={{ color: 'red', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <Link to="/login" style={linkStyle}>Login</Link>
          <Link to="/register" style={linkStyle}>Register</Link>
        </div>
      )}
    </div>
  )
}