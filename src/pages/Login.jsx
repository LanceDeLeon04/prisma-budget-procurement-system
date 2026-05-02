import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { loginStart, loginSuccess, loginFailure } from '../features/auth/authSlice'
import { authAPI } from '../services/api'
import Slideshow from '../components/Slideshow'

// ✅ ICONS
import {
  User,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector((state) => state.auth)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState({ username: false, password: false })

  const usernameError = touched.username && !username ? 'Username is required' : null
  const passwordError = touched.password && !password ? 'Password is required' : null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ username: true, password: true })
    if (!username || !password) return

    dispatch(loginStart())
    try {
      const user = await authAPI.login(username, password)
      dispatch(loginSuccess(user))
      navigate('/dashboard')
    } catch (err) {
      dispatch(loginFailure(err.message))
    }
  }

  return (
    <div className="login-root">
      <Slideshow />

      <div className="login-panel">

        {/* Mobile logo */}
        <div className="login-mobile-logo">
          <span className="login-logo-mark">◈</span>
          <span className="login-logo-name">PRISMA</span>
        </div>

        <div className="login-box">
          <div className="login-box-header">
            <h1 className="login-title">Welcome back</h1>
            <p className="login-subtitle">Sign in to your PRISMA account</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>

            {/* Username */}
            <div className={`login-field ${usernameError ? 'field-error' : username ? 'field-valid' : ''}`}>
              <label className="login-label">Username</label>

              <div className="login-input-wrap">
                <User size={16} className="login-input-icon" />

                <input
                  type="text"
                  className="login-input"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, username: true }))}
                  autoComplete="username"
                />

                {username && !usernameError && (
                  <CheckCircle size={16} className="field-check" />
                )}
              </div>

              {usernameError && (
                <span className="login-error-msg">
                  <AlertTriangle size={14} /> {usernameError}
                </span>
              )}
            </div>

            {/* Password */}
            <div className={`login-field ${passwordError ? 'field-error' : password ? 'field-valid' : ''}`}>
              <label className="login-label">Password</label>

              <div className="login-input-wrap">
                <Lock size={16} className="login-input-icon" />

                <input
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="login-show-pass"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {passwordError && (
                <span className="login-error-msg">
                  <AlertTriangle size={14} /> {passwordError}
                </span>
              )}
            </div>

            {/* Server error */}
            {error && (
              <div className="login-server-error">
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            {/* Hint */}
            <p className="login-hint">Default: admin / admin</p>

            {/* Submit */}
            <button
              type="submit"
              className={`login-btn ${loading ? 'login-btn-loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <span className="login-spinner-wrap">
                  <span className="login-spinner" />
                  Authenticating...
                </span>
              ) : (
                'Sign In to PRISMA'
              )}
            </button>

          </form>

          <div className="login-footer">
            <span>© 2025 PRISMA System · All rights reserved</span>
          </div>
        </div>
      </div>
    </div>
  )
}