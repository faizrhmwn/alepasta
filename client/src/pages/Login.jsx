import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../utils/api'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(username, password)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/')
    } catch (err) {
      setError(err.message || 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card-accent" />
        <div className="login-card-body">
          <div className="login-brand">
            <h1>ALEPASTA</h1>
            <p>Your Daily Homemade Pasta</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="login-input-group">
              <span className="login-input-icon">👤</span>
              <input
                type="text"
                className="form-input"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="login-input-group">
              <span className="login-input-icon">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="login-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {error && <div className="login-error">{error}</div>}
            <button
              type="submit"
              className="btn btn-primary login-btn"
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
