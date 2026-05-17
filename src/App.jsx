import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom'

import Login         from './pages/Login.jsx'
import Dashboard     from './pages/Dashboard.jsx'
import Budget        from './pages/Budget.jsx'
import Reports       from './pages/Reports.jsx'
import Shop          from './pages/Shop.jsx'
import Subscriptions from './pages/Subscriptions.jsx'
import Access        from './pages/Access.jsx'
import Settings      from './pages/Settings.jsx'

const I = ({ d, size = 18, sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
)

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { path:'/dashboard',     label:'Dashboard',     icon:'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',                                                                                                                                                                                                                                                                                                                                                                                                                                                roles:['admin','it_staff','regular_staff'] },
      { path:'/budget',        label:'Budget',        icon:'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',                                                                                                                                                                                                                                                                                                                                                                                                                                                roles:['admin','it_staff','regular_staff'] },
      { path:'/shop',          label:'Shop',          icon:'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0',                                                                                                                                                                                                                                                                                                                                                                                                                         roles:['admin','it_staff','regular_staff'] },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { path:'/reports',       label:'Reports',       icon:'M18 20V10 M12 20V4 M6 20v-6',                                                                                                                                                                                                                                                                                                                                                                                                                                                                               roles:['admin','it_staff','regular_staff'] },
    ],
  },
  {
    label: 'Management',
    items: [
      { path:'/subscriptions', label:'Subscriptions', icon:'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12', roles:['admin','it_staff'] },
      { path:'/access',        label:'Access',        icon:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',                                                                                                                                                                                                                                                                                                                                                                                                                                                              roles:['admin','it_staff'] },
      { path:'/settings',      label:'Settings',      icon:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z', roles:['admin','it_staff','regular_staff'] },
    ],
  },
]

const ROLE_COLORS = { admin:'#ef4444', it_staff:'#06b6d4', regular_staff:'#10b981' }
const ROLE_LABELS = { admin:'Administrator', it_staff:'IT Staff', regular_staff:'Regular Staff' }

function Sidebar({ user, collapsed, onToggle, onLogout }) {
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef(null)
  const role = user?.role ?? 'regular_staff'
  const roleColor = ROLE_COLORS[role] ?? '#06b6d4'
  const roleLabel = ROLE_LABELS[role] ?? role

  useEffect(() => {
    const handler = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        {!collapsed && (
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">PRISMA</span>
            <span className="sidebar-logo-sub">IT Budget Tracker</span>
          </div>
        )}
        <button className="sidebar-collapse-btn" onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points={collapsed ? '9,18 15,12 9,6' : '15,18 9,12 15,6'}/>
          </svg>
        </button>
      </div>

      {!collapsed && (
        <div className="sidebar-role-pill">
          <span className="srp-dot" style={{ background: roleColor }}/>
          <div style={{ minWidth: 0 }}>
            <div className="srp-label">{roleLabel}</div>
            <div className="srp-dept">{user?.department}</div>
          </div>
        </div>
      )}

      <nav className="sidebar-nav">
        {NAV_SECTIONS.map(section => {
          const visible = section.items.filter(item => item.roles.includes(role))
          if (!visible.length) return null
          return (
            <div key={section.label}>
              {!collapsed && <div className="sidebar-section-label">{section.label}</div>}
              {visible.map(item => (
                <NavLink key={item.path} to={item.path}
                  className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
                  <span className="sidebar-item-icon"><I d={item.icon} size={18}/></span>
                  {!collapsed && <span className="sidebar-item-label">{item.label}</span>}
                  {!collapsed && <span className="active-dot" style={{ opacity: 0 }}/>}
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>

      <div className="sidebar-user" ref={dropRef} onClick={() => setDropOpen(v => !v)}>
        <div className="sidebar-avatar" style={{ background: `linear-gradient(135deg,${roleColor},${roleColor}99)` }}>
          {user?.avatar ?? 'U'}
        </div>
        {!collapsed && (
          <>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name}</span>
              <span className="sidebar-user-role">{roleLabel}</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points={dropOpen ? '18,15 12,9 6,15' : '6,9 12,15 18,9'}/>
            </svg>
          </>
        )}
        {dropOpen && (
          <div className="sidebar-dropdown">
            <NavLink to="/settings" className="sidebar-dropdown-item" onClick={() => setDropOpen(false)}>
              <I d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" size={15}/> Settings
            </NavLink>
            <button className="sidebar-dropdown-item" onClick={onLogout}>
              <I d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" size={15}/> Sign Out
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

function AppShell({ user, onLogout }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="app-shell">
      <Sidebar user={user} collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} onLogout={onLogout}/>
      <main className={`page-content${collapsed ? ' collapsed' : ''}`}>
        <Routes>
          <Route path="/"              element={<Navigate to="/dashboard" replace/>}/>
          <Route path="/dashboard"     element={<Dashboard/>}/>
          <Route path="/budget"        element={<Budget/>}/>
          <Route path="/shop"          element={<Shop/>}/>
          <Route path="/subscriptions" element={<Subscriptions/>}/>
          <Route path="/reports"       element={<Reports/>}/>
          <Route path="/access"        element={<Access/>}/>
          <Route path="/settings"      element={<Settings/>}/>
          <Route path="*"              element={<Navigate to="/dashboard" replace/>}/>
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { const raw = sessionStorage.getItem('prisma_user'); return raw ? JSON.parse(raw) : null }
    catch { return null }
  })
  const handleLogin  = u => { sessionStorage.setItem('prisma_user', JSON.stringify(u)); setUser(u) }
  const handleLogout = () => { sessionStorage.removeItem('prisma_user'); setUser(null) }
  return (
    <BrowserRouter>
      {!user ? <Login onLogin={handleLogin}/> : <AppShell user={user} onLogout={handleLogout}/>}
    </BrowserRouter>
  )
}
