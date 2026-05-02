export default function Card({ title, value, subtitle, icon, accent = '#06b6d4', trend, loading = false }) {
  return (
    <div className="stat-card" style={{ '--card-accent': accent }}>
      <div className="stat-card-header">
        <div className="stat-card-icon" style={{ background: `${accent}18`, color: accent }}>
          {icon}
        </div>
        {trend !== undefined && (
          <span className={`stat-card-trend ${trend >= 0 ? 'trend-up' : 'trend-down'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>

      {loading ? (
        <div className="stat-card-skeleton">
          <div className="skeleton-line skeleton-line-lg" />
          <div className="skeleton-line skeleton-line-sm" />
        </div>
      ) : (
        <>
          <div className="stat-card-value">{value}</div>
          <div className="stat-card-title">{title}</div>
          {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
        </>
      )}

      <div className="stat-card-bar" style={{ background: accent }} />
    </div>
  )
}