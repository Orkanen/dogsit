import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  margin: '0.5rem 0',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '1rem',
}
const buttonStyle = {
  width: '100%',
  padding: '0.75rem',
  marginTop: '1rem',
  background: '#f59e0b',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '1rem',
}
const linkStyle = { color: '#1d4ed8', textDecoration: 'underline', fontWeight: '500' }

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', roleNames: [] })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value, checked } = e.target
    if (name === 'roleNames') {
      setForm((prev) => ({
        ...prev,
        roleNames: checked
          ? [...prev.roleNames, value]
          : prev.roleNames.filter((r) => r !== value),
      }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!form.email || !form.password || form.roleNames.length === 0) {
      setError('Email, password, and at least one role required')
      setLoading(false)
      return
    }

    try {
      await api.register(form.email, form.password, form.roleNames)
      alert('Account created! Please log in.')
      navigate('/login')
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '420px', margin: '0 auto' }}>
      <h2>Register</h2>
      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          style={inputStyle}
          disabled={loading}
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          style={inputStyle}
          disabled={loading}
        />

        <div style={{ margin: '1rem 0' }}>
          <p style={{ marginBottom: '0.5rem' }}>Choose role(s):</p>
          {['owner', 'sitter'].map((role) => (
            <label key={role} style={{ display: 'block', margin: '0.4rem 0' }}>
              <input
                type="checkbox"
                name="roleNames"
                value={role}
                checked={form.roleNames.includes(role)}
                onChange={handleChange}
                disabled={loading}
                style={{ marginRight: '0.5rem' }}
              />
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </label>
          ))}
        </div>

        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? 'Creating…' : 'Create Account'}
        </button>
      </form>

      <div style={{ marginTop: '1rem' }}>
        <Link to="/login" style={linkStyle}>Already have an account? Login</Link>
      </div>
    </div>
  )
}