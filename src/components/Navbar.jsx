import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { logout } from '../features/auth/authSlice'

const NAV_ITEMS = [
  { label:'Dashboard',      path:'/dashboard', icon:'⊞' },
  { label:'Budget Ledger',  path:'/budget',    icon:'📒' },
  { label:'Shop',           path:'/shop',      icon:'🛒' },
  { label:'Requests',       path:'/requests',  icon:'📋' },
  { label:'Access Control', path:'/access',    icon:'🔑' },
  { label:'Reports',        path:'/reports',   icon:'📈' },
  { label:'Settings',       path:'/settings',  icon:'⚙️' },
]

export default function Navbar() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const location  = useLocation()
  const user      = useSelector((s) => s.auth.user)
  const [collapsed,     setCollapsed]     = useState(false)
  const [showUserMenu,  setShowUserMenu]  = useState(false)

  const handleLogout = () => { dispatch(logout()); navigate('/login') }

  return (
    <aside className={`navbar-sidebar${collapsed?' navbar-collapsed':''}`}>
      <div className="navbar-logo">
        <div className="navbar-logo-mark">◈</div>
        {!collapsed && (
          <div className="navbar-logo-text">
            <span className="navbar-logo-name">PRISMA</span>
            <span className="navbar-logo-sub">Enterprise Suite</span>
          </div>
        )}
        <button className="navbar-collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      <nav className="navbar-nav">
        {!collapsed && <div className="navbar-section-label">MAIN MENU</div>}
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <button key={item.path}
              className={`navbar-item${isActive?' navbar-item-active':''}`}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : ''}>
              <span className="navbar-item-icon">{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="navbar-item-label">{item.label}</span>
                  {isActive && <span className="navbar-active-dot" />}
                </>
              )}
            </button>
          )
        })}
      </nav>

      <div className="navbar-user" onClick={() => setShowUserMenu(!showUserMenu)}>
        <div className="navbar-avatar">{user?.name?.charAt(0) || 'A'}</div>
        {!collapsed && (
          <div className="navbar-user-info">
            <span className="navbar-user-name">{user?.name || 'Administrator'}</span>
            <span className="navbar-user-role">{user?.role || 'admin'}</span>
          </div>
        )}
        {showUserMenu && (
          <div className="navbar-user-dropdown">
            <button className="navbar-dropdown-item" onClick={() => { navigate('/settings'); setShowUserMenu(false) }}>
              ⚙️ Settings
            </button>
            <button className="navbar-dropdown-item" onClick={handleLogout}>
              ⎋ Sign Out
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
