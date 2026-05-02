import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { logout } from '../features/auth/authSlice'

import {
  LayoutDashboard,
  BookOpen,
  ShoppingCart,
  ClipboardList,
  KeyRound,
  BarChart3,
  Settings,
  LogOut
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} />, active: true },
  { label: 'Budget Ledger', path: '/budget', icon: <BookOpen size={18} />, locked: true },
  { label: 'Shop / Procurement', path: '/shop', icon: <ShoppingCart size={18} />, locked: true },
  { label: 'Request Items', path: '/requests', icon: <ClipboardList size={18} />, locked: true },
  { label: 'Access Control', path: '/access', icon: <KeyRound size={18} />, locked: true },
  { label: 'Reports', path: '/reports', icon: <BarChart3 size={18} />, locked: true },
  { label: 'Settings', path: '/settings', icon: <Settings size={18} />, locked: true },
]

export default function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useSelector((state) => state.auth.user)

  const [collapsed, setCollapsed] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <aside className={`navbar-sidebar ${collapsed ? 'navbar-collapsed' : ''}`}>

      {/* LOGO */}
      <div className="navbar-logo">
        <div className="navbar-logo-mark">◈</div>

        {!collapsed && (
          <div className="navbar-logo-text">
            <span className="navbar-logo-name">PRISMA</span>
            <span className="navbar-logo-sub">Enterprise Suite</span>
          </div>
        )}

        <button
          className="navbar-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* NAV */}
      <nav className="navbar-nav">
        <div className="navbar-section-label">
          {!collapsed && 'MAIN MENU'}
        </div>

        {navItems.map((item) => {
          const isActive = location.pathname === item.path

          return (
            <button
              key={item.path}
              className={`navbar-item ${
                isActive ? 'navbar-item-active' : ''
              } ${item.locked ? 'navbar-item-locked' : ''}`}
              onClick={() => !item.locked && navigate(item.path)}
            >
              <span className="navbar-item-icon">
                {item.icon}
              </span>

              {!collapsed && (
                <>
                  <span className="navbar-item-label">
                    {item.label}
                  </span>

                  {item.locked && (
                    <span className="navbar-lock-badge">
                      Locked
                    </span>
                  )}

                  {isActive && <span className="navbar-active-dot" />}
                </>
              )}
            </button>
          )
        })}
      </nav>

      {/* USER */}
      <div className="navbar-user" onClick={() => setShowUserMenu(!showUserMenu)}>
        <div className="navbar-avatar">
          {user?.name?.charAt(0) || 'A'}
        </div>

        {!collapsed && (
          <div className="navbar-user-info">
            <span className="navbar-user-name">
              {user?.name || 'Administrator'}
            </span>
            <span className="navbar-user-role">
              {user?.role || 'admin'}
            </span>
          </div>
        )}

        {showUserMenu && (
          <div className="navbar-user-dropdown">
            <button className="navbar-dropdown-item" onClick={handleLogout}>
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        )}
      </div>

    </aside>
  )
}