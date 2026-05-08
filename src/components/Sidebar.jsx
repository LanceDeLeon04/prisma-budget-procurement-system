import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { logout } from '../features/auth/authSlice'
import { useRole } from '../hooks/useRole'

const ICON = {
  dashboard: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  shop:      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  requests:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>,
  budget:    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  reports:   <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  access:    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  settings:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M2 12h2M20 12h2M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41"/></svg>,
  logout:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  chevL:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>,
  chevR:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,18 15,12 9,6"/></svg>,
}

const ROLE_COLORS = { admin:'#ef4444', it_staff:'#06b6d4', regular_staff:'#10b981' }
const ROLE_LABELS = { admin:'Administrator', it_staff:'IT Staff', regular_staff:'Regular Staff' }

export default function Sidebar({ collapsed, setCollapsed }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, role, isAdmin, isITStaff, isStaff } = useRole()
  const [showMenu, setShowMenu] = useState(false)

  const NAV = [
    { label:'Dashboard', path:'/dashboard', icon:ICON.dashboard, show:true },
    { label:'Shop',      path:'/shop',      icon:ICON.shop,      show:true },
    { label:'Requests',  path:'/requests',  icon:ICON.requests,  show:true },
    { label:'Budget',    path:'/budget',    icon:ICON.budget,    show:isAdmin || isITStaff },
    { label:'Reports',   path:'/reports',   icon:ICON.reports,   show:true },
    { label:'Access',    path:'/access',    icon:ICON.access,    show:isAdmin },
    { label:'Settings',  path:'/settings',  icon:ICON.settings,  show:isAdmin },
  ].filter(n => n.show)

  const roleColor = ROLE_COLORS[role] || '#06b6d4'

  return (
    <aside className={`sidebar${collapsed?' collapsed':''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"/><line x1="12" y1="2" x2="12" y2="22"/><polyline points="2,8.5 12,14 22,8.5"/></svg>
        </div>
        {!collapsed && (
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">PRISMA</span>
            <span className="sidebar-logo-sub">IT Procurement Suite</span>
          </div>
        )}
        <button className="sidebar-collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? ICON.chevR : ICON.chevL}
        </button>
      </div>

      {!collapsed && (
        <div className="sidebar-role-pill">
          <div className="srp-dot" style={{ background: roleColor, boxShadow: `0 0 6px ${roleColor}` }} />
          <div>
            <div className="srp-label">{ROLE_LABELS[role] || role}</div>
            <div className="srp-dept">{user?.department}</div>
          </div>
        </div>
      )}

      <nav className="sidebar-nav">
        {!collapsed && <div className="sidebar-section-label">MAIN MENU</div>}
        {NAV.map(item => {
          const isActive = location.pathname === item.path
          return (
            <button key={item.path} className={`sidebar-item${isActive?' active':''}`}
              onClick={() => navigate(item.path)} title={collapsed ? item.label : ''}>
              <span className="sidebar-item-icon">{item.icon}</span>
              {!collapsed && <><span className="sidebar-item-label">{item.label}</span>{isActive && <span className="active-dot"/>}</>}
            </button>
          )
        })}
      </nav>

      <div className="sidebar-user" onClick={() => setShowMenu(!showMenu)}>
        <div className="sidebar-avatar" style={{ background: `linear-gradient(135deg,${roleColor},${roleColor}99)` }}>
          {user?.avatar || user?.name?.charAt(0) || 'U'}
        </div>
        {!collapsed && (
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.name}</span>
            <span className="sidebar-user-role">{ROLE_LABELS[role]}</span>
          </div>
        )}
        {showMenu && (
          <div className="sidebar-dropdown">
            {isAdmin && (
              <button className="sidebar-dropdown-item" onClick={() => { navigate('/settings'); setShowMenu(false) }}>
                {ICON.settings}<span>Settings</span>
              </button>
            )}
            <button className="sidebar-dropdown-item" onClick={() => { dispatch(logout()); navigate('/login') }}>
              {ICON.logout}<span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
