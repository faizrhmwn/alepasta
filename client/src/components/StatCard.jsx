import './StatCard.css'

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color,
  delay = 0,
}) {
  return (
    <div
      className="stat-card"
      style={{
        borderLeftColor: color || 'var(--accent-primary)',
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="stat-card-icon">{icon}</div>
      <p className="stat-card-title">{title}</p>
      <h3 className="stat-card-value">{value}</h3>
      {subtitle && <p className="stat-card-subtitle">{subtitle}</p>}
      {trend && (
        <span className={`stat-card-trend ${trend.direction}`}>
          {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
        </span>
      )}
    </div>
  )
}
