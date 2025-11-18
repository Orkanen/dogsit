import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from "@/context/AuthContext"
import api from "@/api"

import "@/styles/pages/_login.scss"

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'
  const { login } = useAuth()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await api.login(form.email, form.password)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      login(data.token, data.user)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__card">
        <h2>Login to Dog/Sit</h2>

        {error && <div className="login-page__error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-page__form">
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="login-page__input"
            required
            autoFocus
            disabled={loading}
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="login-page__input"
            required
            disabled={loading}
          />
          <button type="submit" className="login-page__button" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="login-page__footer">
          <Link to="/register">Need an account? Register</Link>
        </div>
      </div>
    </div>
  )
}