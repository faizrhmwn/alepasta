import { useState, useEffect } from 'react'
import StatCard from '../components/StatCard'
import { getDashboard } from '../utils/api'
import { formatRupiah } from '../utils/format'
import { showToast } from '../utils/toast'
import './BagiHasil.css'

export default function BagiHasil() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profitMargin, setProfitMargin] = useState(35) // Default 35%

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="animate-in">
        <div className="dashboard-stats">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      </div>
    )
  }

  const { today, thisMonth } = data || {}
  const todayRevenue = today?.revenue || 0
  const monthRevenue = thisMonth?.revenue || 0

  const todayProfit = Math.round(todayRevenue * (profitMargin / 100))
  const todayCapital = todayRevenue - todayProfit

  const monthProfit = Math.round(monthRevenue * (profitMargin / 100))
  const monthCapital = monthRevenue - monthProfit

  return (
    <div className="animate-in bagi-hasil-page">
      <div className="glass-card margin-control">
        <h3>🎛️ Pengaturan Margin Laba</h3>
        <p className="margin-desc">Atur persentase Laba Bersih yang ingin disisihkan. Sisa dari persentase ini akan dialokasikan sebagai Modal Belanja.</p>
        
        <div className="slider-container">
          <input
            type="range"
            min="0"
            max="100"
            value={profitMargin}
            onChange={(e) => setProfitMargin(parseInt(e.target.value))}
            className="margin-slider"
            style={{ background: `linear-gradient(to right, #27AE60 ${profitMargin}%, var(--glass-border) ${profitMargin}%)` }}
          />
          <div className="slider-values">
            <span className="profit-label">Laba: {profitMargin}%</span>
            <span className="capital-label">Modal: {100 - profitMargin}%</span>
          </div>
        </div>
      </div>

      <div className="split-section">
        <h3 className="dashboard-section-title">📅 Rekap Hari Ini</h3>
        <div className="dashboard-stats">
          <StatCard
            icon="💵"
            title="Total Omzet"
            value={formatRupiah(todayRevenue)}
            delay={0}
            color="#9CA3AF"
          />
          <StatCard
            icon="💰"
            title={`Laba Bersih (${profitMargin}%)`}
            value={formatRupiah(todayProfit)}
            delay={100}
            color="#27AE60"
          />
          <StatCard
            icon="🛒"
            title={`Modal Belanja (${100 - profitMargin}%)`}
            value={formatRupiah(todayCapital)}
            delay={200}
            color="#E67E22"
          />
        </div>
      </div>

      <div className="split-section" style={{ marginTop: '2rem' }}>
        <h3 className="dashboard-section-title">📊 Rekap Bulan Ini</h3>
        <div className="dashboard-stats">
          <StatCard
            icon="💵"
            title="Total Omzet"
            value={formatRupiah(monthRevenue)}
            delay={0}
            color="#9CA3AF"
          />
          <StatCard
            icon="💰"
            title={`Laba Bersih (${profitMargin}%)`}
            value={formatRupiah(monthProfit)}
            delay={100}
            color="#27AE60"
          />
          <StatCard
            icon="🛒"
            title={`Modal Belanja (${100 - profitMargin}%)`}
            value={formatRupiah(monthCapital)}
            delay={200}
            color="#E67E22"
          />
        </div>
      </div>
    </div>
  )
}
