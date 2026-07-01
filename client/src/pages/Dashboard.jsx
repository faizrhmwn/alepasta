import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import StatCard from '../components/StatCard'
import { getDashboard } from '../utils/api'
import {
  formatRupiah,
  formatDate,
  formatDateShort,
  getCategoryBadgeClass,
  getToday,
  groupSalesByTransaction,
  formatCategoryName,
} from '../utils/format'
import { showToast } from '../utils/toast'
import './Dashboard.css'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{formatDateShort(label)}</p>
      <p className="tooltip-value">{formatRupiah(payload[0]?.value)}</p>
      {payload[0]?.payload?.items != null && (
        <p className="tooltip-sub">{payload[0].payload.items} item</p>
      )}
    </div>
  )
}

function RecentSaleGroup({ group }) {
  const [expanded, setExpanded] = useState(false)
  const totalGroupPrice = group.reduce((sum, s) => sum + s.totalPrice, 0)
  const totalGroupItems = group.reduce((sum, s) => sum + (s.quantity || 1), 0)
  const firstSale = group[0]
  
  const dateObj = new Date(firstSale.createdAt)
  const dateStr = dateObj.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })
  const time = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  const timeString = `${dateStr}, ${time}`
  
  return (
    <li className="recent-sale-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0', padding: 0, overflow: 'hidden' }}>
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '12px 16px',
          cursor: 'pointer',
          background: expanded ? 'rgba(255,255,255,0.05)' : 'transparent',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        onMouseLeave={(e) => e.currentTarget.style.background = expanded ? 'rgba(255,255,255,0.05)' : 'transparent'}
      >
         <div style={{ fontSize: '0.8rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block', fontSize: '0.7rem' }}>▶</span>
            <span className="order-type-badge">{firstSale.orderType || 'Dine-in'}</span>
            <span className="order-type-badge" style={{ background: firstSale.paymentMethod === 'QRIS' ? '#8E44AD' : '#27AE60' }}>
              {firstSale.paymentMethod || 'Cash'}
            </span>
            <span>({totalGroupItems} item)</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span>{timeString}</span>
         </div>
         <div style={{ fontWeight: 'bold', color: 'var(--red)' }}>
            {formatRupiah(totalGroupPrice)}
         </div>
      </div>
      
      {expanded && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {group.map((sale, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
              <div className="recent-sale-info">
                <span className={`badge ${getCategoryBadgeClass(sale.category)}`}>
                  {formatCategoryName(sale.category)}
                </span>
                <span className="recent-sale-name">{sale.productName}</span>
              </div>
              <div className="recent-sale-detail" style={{ fontSize: '0.85rem' }}>
                <div className="recent-sale-qty" style={{ opacity: 0.8 }}>{sale.quantity}x</div>
                <div className="recent-sale-total">{formatRupiah(sale.totalPrice)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </li>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false))
  }, [])
  const today = getToday()

  if (loading) {
    return (
      <div className="animate-in">
        <div className="dashboard-welcome">
          <div>
            <div className="skeleton" style={{ width: 250, height: 28 }} />
            <div className="skeleton mt-1" style={{ width: 180, height: 16 }} />
          </div>
        </div>
        <div className="dashboard-stats">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
        <div className="dashboard-charts">
          <div className="skeleton skeleton-chart" />
          <div className="skeleton skeleton-chart" />
        </div>
      </div>
    )
  }

  const {
    today: todayData,
    thisMonth,
    topProducts,
    weeklyTrend,
    recentSales,
  } = data || {}

  return (
    <div className="animate-in">
      <div className="dashboard-welcome">
        <div>
          <h2>Selamat datang! 👋</h2>
          <p>{formatDate(today)}</p>
        </div>
        <Link to="/input" className="btn btn-primary">
          ➕ Input Penjualan Baru
        </Link>
      </div>

      <div className="dashboard-stats">
        <StatCard
          icon="💰"
          title="Pendapatan Hari Ini"
          value={formatRupiah(todayData?.revenue)}
          subtitle={`Cash: ${formatRupiah(todayData?.totalCash || 0)} | QRIS: ${formatRupiah(todayData?.totalQris || 0)}`}
          delay={0}
        />
        <StatCard
          icon="📦"
          title="Item Terjual Hari Ini"
          value={`${todayData?.items || 0} item`}
          delay={100}
          color="#3498DB"
        />
        <StatCard
          icon="💰"
          title="Pendapatan Bulan Ini"
          value={formatRupiah(thisMonth?.revenue)}
          delay={200}
          color="#27AE60"
        />
        <StatCard
          icon="📦"
          title="Transaksi Bulan Ini"
          value={`${thisMonth?.transactions || 0} transaksi`}
          delay={300}
          color="#9B59B6"
        />
      </div>

      <div className="dashboard-charts">
        <div className="glass-card">
          <h3 className="dashboard-section-title">🏆 Menu Terlaris Hari Ini</h3>
          {topProducts?.length > 0 ? (
            <ul className="top-menu-list">
              {topProducts.slice(0, 5).map((item, idx) => (
                <li key={idx} className="top-menu-item">
                  <div className="top-menu-info">
                    <span className="top-menu-rank">{idx + 1}</span>
                    <span className="top-menu-name">{item.productName}</span>
                    <span
                      className={`badge ${getCategoryBadgeClass(item.category)}`}
                    >
                      {formatCategoryName(item.category)}
                    </span>
                  </div>
                  <div className="top-menu-stats">
                    <div className="top-menu-qty">{item.quantity}x</div>
                    <div className="top-menu-revenue">
                      {formatRupiah(item.revenue)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <p>Belum ada penjualan hari ini</p>
            </div>
          )}
        </div>

        <div className="glass-card">
          <h3 className="dashboard-section-title">📈 Tren 7 Hari Terakhir</h3>
          {weeklyTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={weeklyTrend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E67E22" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#E67E22" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateShort}
                  stroke="#606070"
                  fontSize={12}
                />
                <YAxis
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  stroke="#606070"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#E67E22"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <p>Belum ada data tren</p>
            </div>
          )}
        </div>
      </div>

      <div className="glass-card">
        <h3 className="dashboard-section-title">🕐 Penjualan Terbaru</h3>
        {recentSales?.length > 0 ? (
          <ul className="recent-sales-list">
            {groupSalesByTransaction(recentSales).slice(0, 10).map((group, groupIdx) => (
              <RecentSaleGroup key={groupIdx} group={group} />
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p>Belum ada penjualan</p>
          </div>
        )}
      </div>
    </div>
  )
}
