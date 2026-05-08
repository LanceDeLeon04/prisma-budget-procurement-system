import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { loginStart, loginSuccess, loginFailure } from '../features/auth/authSlice'
import { authAPI } from '../services/api'
import Slideshow from '../components/Slideshow'

const EyeOpen = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const EyeOff = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
const UserIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const LockIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>
const AlertIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>

const ROLE_COLOR = { admin:'#ef4444', 'IT Staff':'#06b6d4', Staff:'#10b981' }

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector(s => s.auth)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [touched, setTouched] = useState({ username: false, password: false })

  const uErr = touched.username && !username ? 'Username is required' : null
  const pErr = touched.password && !password ? 'Password is required' : null

  const handleSubmit = async e => {
    e.preventDefault()
    setTouched({ username: true, password: true })
    if (!username || !password) return
    dispatch(loginStart())
    try {
      const user = await authAPI.login(username, password)
      dispatch(loginSuccess(user))
      navigate('/dashboard')
    } catch (err) { dispatch(loginFailure(err.message)) }
  }

  const CREDS = [
    { role:'Admin',    user:'admin',   pass:'admin',   color:'#ef4444', desc:'Full access — budget, reports, users' },
    { role:'IT Staff', user:'itstaff', pass:'itstaff', color:'#06b6d4', desc:'Approve requests, shop, budget alerts' },
    { role:'Staff',    user:'staff',   pass:'staff',   color:'#10b981', desc:'Submit requests, view dept budget' },
  ]

  return (
    <div className="login-root">
      <Slideshow />
      <div className="login-panel">
        <div className="login-mobile-logo">
          <div className="login-logo-mark-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"/></svg>
          </div>
          <span className="login-logo-name">PRISMA</span>
        </div>
        <div className="login-box">
          <div className="login-box-header">
            <h1 className="login-title">Welcome back</h1>
            <p className="login-subtitle">Sign in to access the IT Procurement platform</p>
          </div>
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className={`login-field${uErr ? ' field-error' : username ? ' field-valid' : ''}`}>
              <label className="login-label">Username</label>
              <div className="login-input-wrap">
                <span className="login-input-icon"><UserIcon /></span>
                <input type="text" className="login-input" placeholder="Enter your username" value={username}
                  onChange={e => setUsername(e.target.value)} onBlur={() => setTouched(t => ({ ...t, username: true }))} autoComplete="username" />
                {username && !uErr && <span className="field-check"><CheckIcon /></span>}
              </div>
              {uErr && <span className="login-error-msg"><AlertIcon /> {uErr}</span>}
            </div>
            <div className={`login-field${pErr ? ' field-error' : password ? ' field-valid' : ''}`}>
              <label className="login-label">Password</label>
              <div className="login-input-wrap">
                <span className="login-input-icon"><LockIcon /></span>
                <input type={showPass ? 'text' : 'password'} className="login-input" placeholder="Enter your password" value={password}
                  onChange={e => setPassword(e.target.value)} onBlur={() => setTouched(t => ({ ...t, password: true }))} autoComplete="current-password" />
                <button type="button" className="login-show-pass" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>
              {pErr && <span className="login-error-msg"><AlertIcon /> {pErr}</span>}
            </div>
            {error && <div className="login-server-error"><AlertIcon /> {error}</div>}
            <div style={{ background:'linear-gradient(135deg,rgba(6,182,212,.05),rgba(59,130,246,.04))',border:'1px solid rgba(6,182,212,.15)',borderRadius:11,padding:'12px 15px' }}>
              <div style={{ fontSize:10,fontWeight:800,color:'#0891b2',textTransform:'uppercase',letterSpacing:'.07em',fontFamily:'JetBrains Mono,monospace',marginBottom:9 }}>Demo Credentials — click to fill</div>
              {CREDS.map(c => (
                <div key={c.role} onClick={() => { setUsername(c.user); setPassword(c.pass) }}
                  style={{ display:'flex',alignItems:'center',gap:10,padding:'5px 7px',marginBottom:4,borderRadius:8,cursor:'pointer',transition:'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(6,182,212,.08)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <span style={{ fontSize:11,fontWeight:700,padding:'2px 9px',borderRadius:5,background:`${c.color}18`,color:c.color,fontFamily:'JetBrains Mono,monospace',minWidth:58,textAlign:'center' }}>{c.role}</span>
                  <span style={{ fontSize:11,color:'#64748b',fontFamily:'JetBrains Mono,monospace',flex:1 }}>{c.user} / {c.pass}</span>
                  <span style={{ fontSize:11,color:'#94a3b8' }}>{c.desc}</span>
                </div>
              ))}
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? <span className="login-spinner-wrap"><span className="login-spinner" />Authenticating...</span> : 'Sign In to PRISMA'}
            </button>
          </form>
          <div className="login-footer">© 2025 PRISMA · IT Procurement & Resource Management System</div>
        </div>
      </div>
    </div>
  )
}
