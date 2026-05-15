/**
 * PageLayout — wraps every page. Renders the .page-header block
 * (badge + title + subtitle + optional action buttons) then the
 * scrollable .page-body below. Matches the CSS classes defined in
 * styles.css: .page-header, .page-badge, .page-title, .page-subtitle,
 * .page-actions, .page-body.
 */
export default function PageLayout({ title, subtitle, badge, actions, children }) {
  const BADGE_COLORS = {
    Dashboard: '#06b6d4',
    Budget:    '#3b82f6',
    Reports:   '#8b5cf6',
    Shop:      '#10b981',
    Access:    '#f59e0b',
    Settings:  '#64748b',
  }
  const color = BADGE_COLORS[badge] ?? '#06b6d4'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          {badge && (
            <div className="page-badge" style={{ color }}>
              <svg width="8" height="8" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="4" fill={color}/>
              </svg>
              {badge}
            </div>
          )}
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>

      {/* Page body */}
      <div className="page-body">
        {children}
      </div>
    </div>
  )
}
