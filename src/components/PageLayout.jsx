import Navbar from './Navbar'

export default function PageLayout({ children, title, subtitle, badge, actions }) {
  return (
    <div className="dashboard-root">
      <Navbar />
      <main className="dashboard-main">
        <div className="page-header">
          <div className="page-header-left">
            {badge && <span className="page-badge">{badge}</span>}
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="page-header-actions">{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  )
}
