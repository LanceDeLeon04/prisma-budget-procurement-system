import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { loginStart, loginSuccess, loginFailure } from '../features/auth/authSlice'
import { authAPI } from '../services/api'
import Slideshow from '../components/Slideshow'

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector((s) => s.auth)

  const [username,     setUsername]     = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [touched,      setTouched]      = useState({ username: false, password: false })

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

  const fillCreds = (u, p) => { setUsername(u); setPassword(p) }

  return (
    <div className="login-root">
      <Slideshow />
      <div className="login-panel">
        <div className="login-mobile-logo">
          <span className="login-logo-mark">◈</span>
          <span className="login-logo-name">PRISMA</span>
        </div>

        <div className="login-box">
          <div className="login-box-header">
            <h1 className="login-title">Welcome back</h1>
            <p className="login-subtitle">Sign in to your PRISMA account to continue</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div className={`login-field${usernameError?' field-error':username?' field-valid':''}`}>
              <label className="login-label">Username</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <input type="text" className="login-input" placeholder="Enter your username"
                  value={username} onChange={e=>setUsername(e.target.value)}
                  onBlur={()=>setTouched(t=>({...t,username:true}))} autoComplete="username"/>
                {username && !usernameError && (
                  <span className="field-check">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>
                  </span>
                )}
              </div>
              {usernameError && <span className="login-error-msg">⚠ {usernameError}</span>}
            </div>

            {/* Password */}
            <div className={`login-field${passwordError?' field-error':password?' field-valid':''}`}>
              <label className="login-label">Password</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input type={showPassword?'text':'password'} className="login-input" placeholder="Enter your password"
                  value={password} onChange={e=>setPassword(e.target.value)}
                  onBlur={()=>setTouched(t=>({...t,password:true}))} autoComplete="current-password"/>
                <button type="button" className="login-show-pass" onClick={()=>setShowPassword(!showPassword)}>
                  {showPassword
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {passwordError && <span className="login-error-msg">⚠ {passwordError}</span>}
            </div>

            {error && <div className="login-server-error">⚠ {error}</div>}

            {/* Demo credentials */}
            <div style={{ background:'linear-gradient(135deg,rgba(6,182,212,.05),rgba(59,130,246,.04))', border:'1px solid rgba(6,182,212,.15)', borderRadius:10, padding:'12px 16px' }}>
              <div style={{ fontSize:10, fontWeight:800, color:'#0891b2', textTransform:'uppercase', letterSpacing:'.07em', fontFamily:'JetBrains Mono,monospace', marginBottom:10 }}>
                Demo Credentials — click to fill
              </div>
              {[
                { role:'Admin',    user:'admin',   pass:'admin',   color:'#ef4444', desc:'Full Access' },
                { role:'IT Staff', user:'itstaff', pass:'itstaff', color:'#06b6d4', desc:'Shop & Process Requests' },
                { role:'Staff',    user:'staff',   pass:'staff',   color:'#10b981', desc:'Submit Requests Only' },
              ].map(c => (
                <div key={c.role}
                  onClick={() => fillCreds(c.user, c.pass)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 8px', marginBottom:4, borderRadius:8, cursor:'pointer', transition:'background .15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(6,182,212,.08)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <span style={{ fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:5, background:`${c.color}18`, color:c.color, fontFamily:'JetBrains Mono,monospace', minWidth:58, textAlign:'center' }}>{c.role}</span>
                  <span style={{ fontSize:11, color:'#64748b', fontFamily:'JetBrains Mono,monospace', flex:1 }}>{c.user} / {c.pass}</span>
                  <span style={{ fontSize:11, color:'#94a3b8' }}>{c.desc}</span>
                </div>
              ))}
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading
                ? <span className="login-spinner-wrap"><span className="login-spinner"/> Authenticating...</span>
                : 'Sign In to PRISMA'
              }
            </button>
          </form>

          <div className="login-footer">© 2025 PRISMA System · IT Procurement Platform</div>
        </div>
      </div>
    </div>
  )
}
