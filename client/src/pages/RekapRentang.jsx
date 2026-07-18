import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../components/StatCard'
import { getRangeRecap } from '../utils/api'
import {
  formatRupiah,
  formatDate,
  getCategoryBadgeClass,
  formatCategoryName,
  getToday,
} from '../utils/format'
import { showToast } from '../utils/toast'
import './RekapBulanan.css' // We can reuse the CSS from Rekap Bulanan since the layout is identical

export default function RekapRentang() {
  const navigate = useNavigate()
  
  // Default to today and 7 days ago
  const today = getToday()
  const d = new Date()
  d.setDate(d.getDate() - 6)
  const lastWeek = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

  const [startDate, setStartDate] = useState(lastWeek)
  const [endDate, setEndDate] = useState(today)
  
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchRecap = () => {
    if (startDate > endDate) {
      showToast('Tanggal mulai tidak boleh lebih dari tanggal akhir', 'error')
      return
    }
    setLoading(true)
    getRangeRecap(startDate, endDate)
      .then(setData)
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchRecap()
  }, [startDate, endDate])

  const summary = data?.summary || {}
  const dailyBreakdown = data?.dailyBreakdown || []
  const menuBreakdown = data?.productBreakdown || []

  const maxRevenueDate = dailyBreakdown.reduce(
    (max, day) => (day.revenue > (max?.revenue || 0) ? day : max),
    null
  )

  return (
    <div className="animate-in">
      <div className="rekap-nav" style={{ justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>Dari:</span>
          <input
            type="date"
            className="form-input"
            value={startDate}
            max={today}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ width: 'auto' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>Sampai:</span>
          <input
            type="date"
            className="form-input"
            value={endDate}
            max={today}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ width: 'auto' }}
          />
        </div>
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
                        <th><span onClick={() => handleSort('productName')} style={{ cursor: 'pointer' }}>Produk{getSortIndicator('productName')}</span></th>
                        <th><span onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>Kategori{getSortIndicator('category')}</span></th>
                        <th style={{ textAlign: 'center' }}><span onClick={() => handleSort('quantity')} style={{ cursor: 'pointer' }}>Qty{getSortIndicator('quantity')}</span></th>
                        <th style={{ textAlign: 'right' }}><span onClick={() => handleSort('revenue')} style={{ cursor: 'pointer' }}>Total{getSortIndicator('revenue')}</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedArray.map((item, idx) => (
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
