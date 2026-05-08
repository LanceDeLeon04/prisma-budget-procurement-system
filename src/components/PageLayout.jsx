import { useState } from 'react'
import Sidebar from './Sidebar'

export default function PageLayout({ children, title, subtitle, badge, actions }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`page-content${collapsed ? ' collapsed' : ''}`}>
        <div className="page-body">
          <div className="page-header">
            <div className="page-header-left">
              {badge && <div className="page-badge">{badge}</div>}
              <h1 className="page-title">{title}</h1>
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            {actions && <div className="page-actions">{actions}</div>}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
