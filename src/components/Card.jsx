/**
 * Card — KPI stat card. Uses .stat-card, .stat-card-header,
 * .stat-card-icon, .stat-card-value, .stat-card-title,
 * .stat-card-subtitle, .trend-up, .trend-down, .sk-line CSS classes.
 *
 * Props: title, value, subtitle, icon, accent, trend (number %), loading
 */
export default function Card({ title, value, subtitle, icon, accent = '#06b6d4', trend, loading }) {
  if (loading) {
    return (
      <div className="stat-card" style={{ '--card-accent': accent }}>
        <div className="sk-line sk-lg" />
        <div className="sk-line sk-sm" />
      </div>
    )
  }

  const trendUp    = typeof trend === 'number' && trend > 0
  const trendDown  = typeof trend === 'number' && trend < 0
  const trendLabel = typeof trend === 'number'
    ? `${trend > 0 ? '▲' : '▼'} ${Math.abs(trend)}%`
    : null

  return (
    <div className="stat-card" style={{ '--card-accent': accent }}>
      <div className="stat-card-header">
        <div>
          <div className="stat-card-title">{title}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          {icon && (
            <div
              className="stat-card-icon"
              style={{ background: `${accent}18`, color: accent }}
            >
              {icon}
            </div>
          )}
          {trendLabel && (
            <span className={`stat-card-trend ${trendUp ? 'trend-up' : trendDown ? 'trend-down' : ''}`}>
              {trendLabel}
            </span>
          )}
        </div>
      </div>
      <div className="stat-card-value">{value}</div>
      {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
    </div>
  )
}
