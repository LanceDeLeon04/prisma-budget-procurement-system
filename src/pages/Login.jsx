import { useState, useEffect, useRef } from 'react'
import { authAPI } from '../services/api'

// ── Slide content ──────────────────────────────────────────────────
const SLIDES = [
  {
    tag: '💰 ITIL Financial Management',
    tagColor: '#06b6d4',
    headline: 'Real-Time IT Budget\nTracking & Control',
    sub: 'Monitor Hardware, Software License, and Service spending across all departments with live variance alerts and ITIL-aligned cost governance.',
    pills: ['CapEx Tracking', 'OpEx Management', 'Budget Alerts', 'Variance Reports'],
    bg: 'linear-gradient(135deg,#0c1627 0%,#0a2440 60%,#0d3455 100%)',
    orb1: '#06b6d4', orb2: '#3b82f6',
  },
  {
    tag: '🛒 Procurement Workflow',
    tagColor: '#10b981',
    headline: 'Streamlined IT\nProcurement Flow',
    sub: 'From catalog browse to Purchase Request to Purchase Order — a full ITIL-aligned procurement pipeline with role-based approvals and real-time budget impact.',
    pills: ['IT Catalog', 'Purchase Requests', 'PO Management', 'Vendor Registry'],
    bg: 'linear-gradient(135deg,#071a10 0%,#0a2e1a 60%,#0d3a22 100%)',
    orb1: '#10b981', orb2: '#06b6d4',
  },
  {
    tag: '📊 Analytics & Reporting',
    tagColor: '#8b5cf6',
    headline: 'Monthly, Quarterly\n& Variance Reports',
    sub: 'Export-ready PDF and CSV reports. Monthly spend tracking, quarterly review, and variance analysis — everything your IT finance audit needs.',
    pills: ['Monthly Reports', 'Quarterly Review', 'Variance Analysis', 'PDF & CSV Export'],
    bg: 'linear-gradient(135deg,#120b2a 0%,#1a0f3a 60%,#1e1248 100%)',
    orb1: '#8b5cf6', orb2: '#3b82f6',
  },
]

const STATS = [
  { value: '₱5M', label: 'FY 2025 Budget' },
  { value: '3', label: 'ITIL Categories' },
  { value: '24/7', label: 'Budget Monitoring' },
]

// Demo credentials hint
const DEMO_USERS = [
  { label: 'Admin',        username: 'admin',   password: 'admin',   color: '#ef4444' },
  { label: 'IT Staff',     username: 'itstaff', password: 'itstaff', color: '#06b6d4' },
  { label: 'Staff',        username: 'staff',   password: 'staff',   color: '#10b981' },
]

export default function Login({ onLogin }) {
  const [username, setUsername]   = useState('')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [slide, setSlide]         = useState(0)
  const [animClass, setAnimClass] = useState('slide-fade-in')
  const timerRef = useRef(null)

  // Auto-advance slides
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setAnimClass('slide-fade-out')
      setTimeout(() => {
        setSlide(s => (s + 1) % SLIDES.length)
        setAnimClass('slide-fade-in')
      }, 350)
    }, 5000)
    return () => clearInterval(timerRef.current)
  }, [])

  const goSlide = i => {
    clearInterval(timerRef.current)
    setAnimClass('slide-fade-out')
    setTimeout(() => { setSlide(i); setAnimClass('slide-fade-in') }, 300)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!username || !password) { setError('Please enter username and password.'); return }
    setLoading(true); setError('')
    try {
      const user = await authAPI.login(username, password)
      onLogin(user)
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (u) => { setUsername(u.username); setPassword(u.password); setError('') }

  const s = SLIDES[slide]
  const usernameValid = username.length >= 3
  const passwordValid = password.length >= 3

  return (
    <div className="login-root">
      {/* ── Slideshow panel ─────────────────────────────────── */}
      <div className="slideshow-panel" style={{ background: s.bg }}>
        <div className="slide-orb slide-orb-1" style={{ background: s.orb1 }}/>
        <div className="slide-orb slide-orb-2" style={{ background: s.orb2 }}/>
        <div className="slide-grid-overlay"/>

        {/* Brand */}
        <div className="slide-brand">
          <div className="slide-logo">
            <div className="slide-logo-mark">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div>
              <span className="slide-logo-text">PRISMA</span>
              <span className="slide-logo-tagline">IT Budget Tracker</span>
            </div>
          </div>
        </div>

        {/* Slide content */}
        <div className="slide-content">
          <div className={animClass}>
            <div className="slide-tag" style={{ color: s.tagColor, borderColor: `${s.tagColor}40` }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.tagColor, display: 'inline-block' }}/>
              {s.tag}
            </div>
            <h2 className="slide-headline" style={{ whiteSpace: 'pre-line' }}>{s.headline}</h2>
            <p className="slide-subtext">{s.sub}</p>
            <div className="slide-features">
              {s.pills.map(p => <span key={p} className="slide-pill">{p}</span>)}
            </div>
          </div>
        </div>

        {/* Dots */}
        <div>
          <div className="slide-dots">
            {SLIDES.map((_, i) => (
              <button key={i} className="slide-dot" onClick={() => goSlide(i)}
                style={{ width: i === slide ? 24 : 4, background: i === slide ? s.tagColor : 'rgba(255,255,255,.2)' }}/>
            ))}
          </div>
          {/* Stats */}
          <div className="slide-stats">
            {STATS.map(st => (
              <div key={st.label} className="slide-stat">
                <span className="slide-stat-value" style={{ color: s.tagColor }}>{st.value}</span>
                <span className="slide-stat-label">{st.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Login panel ─────────────────────────────────────── */}
      <div className="login-panel">
        {/* Mobile logo */}
        <div className="login-mobile-logo">
          <div className="login-logo-mark-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <span className="login-logo-name">PRISMA</span>
        </div>

        <div className="login-box">
          <div className="login-box-header">
            <h1 className="login-title">Welcome back</h1>
            <p className="login-subtitle">Sign in to your PRISMA account to continue managing the IT budget.</p>
          </div>

          {/* Demo quick-fill */}
          <div style={{ display: 'flex', gap: 7, marginBottom: 20, flexWrap: 'wrap' }}>
            {DEMO_USERS.map(u => (
              <button key={u.username} onClick={() => fillDemo(u)}
                style={{ padding: '5px 12px', borderRadius: 8, border: `1.5px solid ${u.color}40`,
                  background: `${u.color}0d`, color: u.color, fontSize: 11.5, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${u.color}20` }}
                onMouseLeave={e => { e.currentTarget.style.background = `${u.color}0d` }}>
                {u.label}
              </button>
            ))}
            <span style={{ fontSize: 11, color: '#94a3b8', alignSelf: 'center', fontFamily: 'JetBrains Mono,monospace' }}>← click to fill</span>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {/* Username */}
            <div className={`login-field${usernameValid ? ' field-valid' : ''}`}>
              <label className="login-label">Username</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
                <input className="login-input" type="text" placeholder="Enter username"
                  value={username} onChange={e => { setUsername(e.target.value); setError('') }}
                  autoComplete="username" autoFocus/>
                {usernameValid && (
                  <span className="field-check">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>
                  </span>
                )}
              </div>
            </div>

            {/* Password */}
            <div className={`login-field${passwordValid ? ' field-valid' : ''}${error ? ' field-error' : ''}`}>
              <label className="login-label">Password</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input className="login-input" type={showPass ? 'text' : 'password'} placeholder="Enter password"
                  value={password} onChange={e => { setPassword(e.target.value); setError('') }}
                  autoComplete="current-password"/>
                <button type="button" className="login-show-pass" onClick={() => setShowPass(v => !v)}>
                  {showPass
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {error && <div className="login-error-msg">⚠ {error}</div>}
            </div>

            {/* Submit */}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading
                ? <span className="login-spinner-wrap"><span className="login-spinner"/><span>Signing in…</span></span>
                : 'Sign In to PRISMA'
              }
            </button>
          </form>

          <div className="login-footer">
            PRISMA v2.0 &nbsp;·&nbsp; IT Budget & Cost Management &nbsp;·&nbsp; ITIL Aligned
          </div>
        </div>
      </div>
    </div>
  )
}
