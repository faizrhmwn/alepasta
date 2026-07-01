import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../components/StatCard'
import { getMonthlyRecap } from '../utils/api'
import {
  formatRupiah,
  formatDate,
  formatMonth,
  getCategoryBadgeClass,
  formatCategoryName,
} from '../utils/format'
import { showToast } from '../utils/toast'
import './RekapBulanan.css'

export default function RekapBulanan() {
  const navigate = useNavigate()
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getMonthlyRecap(selectedMonth)
      .then(setData)
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false))
  }, [selectedMonth])

  function changeMonth(offset) {
    const [y, m] = selectedMonth.split('-').map(Number)
    const d = new Date(y, m - 1 + offset, 1)
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    setSelectedMonth(newMonth)
  }

  const isCurrentMonth = selectedMonth === currentMonth
  const summary = data?.summary || {}
  const dailyBreakdown = data?.dailyBreakdown || []
  const menuBreakdown = data?.productBreakdown || []

  const maxRevenueDate = dailyBreakdown.reduce(
    (max, day) => (day.revenue > (max?.revenue || 0) ? day : max),
    null
  )

  return (
    <div className="animate-in">
      <div className="rekap-nav">
        <button
          className="btn btn-ghost rekap-nav-btn"
          onClick={() => changeMonth(-1)}
        >
          ◀
        </button>
        <input
          type="month"
          className="form-input"
          value={selectedMonth}
          max={currentMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={{ width: 'auto' }}
        />
        <button
          className="btn btn-ghost rekap-nav-btn"
          onClick={() => changeMonth(1)}
          disabled={isCurrentMonth}
        >
          ▶
        </button>
        <span className="rekap-date-display">{formatMonth(selectedMonth)}</span>
      </div>

      {loading ? (
        <div className="monthly-stats">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 120, borderRadius: 'var(--radius-lg)' }}
            />
          ))}
        </div>
      ) : (
        <>
          <div className="monthly-stats">
            <StatCard
              icon="💰"
              title="Total Pendapatan"
              value={formatRupiah(summary.totalRevenue)}
              subtitle={`Cash: ${formatRupiah(summary.totalCash || 0)} | QRIS: ${formatRupiah(summary.totalQris || 0)}`}
              delay={0}
            />
            <StatCard
              icon="📦"
              title="Total Item"
              value={`${summary.totalItems || 0} item`}
              delay={100}
              color="#3498DB"
            />
            <StatCard
              icon="🧾"
              title="Total Transaksi"
              value={`${summary.totalTransactions || 0} transaksi`}
              delay={150}
              color="#9B59B6"
            />
            <StatCard
              icon="📊"
              title="Rata-rata / Hari"
              value={formatRupiah(summary.avgPerDay)}
              delay={200}
              color="#F1C40F"
            />
            <StatCard
              icon="📅"
              title="Hari Aktif Jualan"
              value={`${summary.daysWithSales || 0} hari`}
              delay={300}
              color="#27AE60"
            />
          </div>

          <div className="monthly-sections">
            <div className="glass-card">
              <h3 className="monthly-section-title">📅 Breakdown Harian</h3>
              {dailyBreakdown.length > 0 ? (
                <div className="rekap-table-wrapper">
                  <table className="glass-table">
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th style={{ textAlign: 'right' }}>Pendapatan</th>
                        <th style={{ textAlign: 'center' }}>Jumlah Item</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyBreakdown.map((day, idx) => {
                        const isMax = maxRevenueDate && day.date === maxRevenueDate.date;
                        return (
                          <tr
                            key={idx}
                            className={`clickable-row ${isMax ? 'highlight-row' : ''}`}
                            onClick={() => navigate(`/rekap-harian?date=${day.date}`)}
                            title="Klik untuk melihat detail hari ini"
                          >
                          <td>{formatDate(day.date)}</td>
                          <td style={{ textAlign: 'right' }}>
                            {formatRupiah(day.revenue)}
                          </td>
                          <td style={{ textAlign: 'center' }}>{day.items}</td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <p>Belum ada data</p>
                </div>
              )}
            </div>

            <div className="glass-card">
              <h3 className="monthly-section-title">🍽️ Breakdown per Menu</h3>
              {menuBreakdown.length > 0 ? (
                <div className="rekap-table-wrapper">
                  <table className="glass-table">
                    <thead>
                      <tr>
                        <th>Produk</th>
                        <th>Kategori</th>
                        <th style={{ textAlign: 'center' }}>Qty</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuBreakdown.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.productName}</td>
                          <td>
                            <span
                              className={`badge ${getCategoryBadgeClass(item.category)}`}
                            >
                              {formatCategoryName(item.category)}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {item.quantity}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {formatRupiah(item.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <p>Belum ada data</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
