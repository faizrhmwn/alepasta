import { useState, useEffect } from 'react'
import StatCard from '../components/StatCard'
import { getDailyRecap } from '../utils/api'
import {
  formatRupiah,
  formatDate,
  getCategoryBadgeClass,
} from '../utils/format'
import { showToast } from '../utils/toast'
import './RekapHarian.css'

export default function RekapHarian() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getDailyRecap(selectedDate)
      .then(setData)
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false))
  }, [selectedDate])

  function changeDate(offset) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + offset)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const today = new Date().toISOString().split('T')[0]
  const isToday = selectedDate === today

  const summary = data?.summary || {}
  const items = data?.items || []
  const records = data?.records || []

  return (
    <div className="animate-in">
      <div className="rekap-nav">
        <button
          className="btn btn-ghost rekap-nav-btn"
          onClick={() => changeDate(-1)}
        >
          ◀
        </button>
        <input
          type="date"
          className="form-input"
          value={selectedDate}
          max={today}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ width: 'auto' }}
        />
        <button
          className="btn btn-ghost rekap-nav-btn"
          onClick={() => changeDate(1)}
          disabled={isToday}
        >
          ▶
        </button>
        <span className="rekap-date-display">{formatDate(selectedDate)}</span>
      </div>

      {loading ? (
        <div className="rekap-stats">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 120, borderRadius: 'var(--radius-lg)' }}
            />
          ))}
        </div>
      ) : (
        <>
          <div className="rekap-stats">
            <StatCard
              icon="💰"
              title="Total Pendapatan"
              value={formatRupiah(summary.totalRevenue)}
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
              delay={200}
              color="#27AE60"
            />
          </div>

          {items.length > 0 ? (
            <div className="glass-card">
              <h3 className="records-title">📊 Ringkasan per Produk</h3>
              <div className="rekap-table-wrapper">
                <table className="glass-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Produk</th>
                      <th>Kategori</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Harga Satuan</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{item.productName}</td>
                        <td>
                          <span
                            className={`badge ${getCategoryBadgeClass(item.category)}`}
                          >
                            {item.category}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>
                          {formatRupiah(item.unitPrice)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {formatRupiah(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                    <tr className="summary-row">
                      <td colSpan="3" style={{ fontWeight: 600 }}>
                        Total
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>
                        {summary.totalItems}
                      </td>
                      <td />
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {formatRupiah(summary.totalRevenue)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="glass-card">
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <p>Belum ada penjualan pada tanggal ini</p>
              </div>
            </div>
          )}

          {records.length > 0 && (
            <div className="glass-card records-section">
              <h3 className="records-title">📝 Detail Transaksi</h3>
              {records.map((rec, idx) => (
                <div key={idx} className="record-item">
                  <div className="record-info">
                    <span
                      className={`badge ${getCategoryBadgeClass(rec.category)}`}
                    >
                      {rec.category}
                    </span>
                    <div>
                      <div className="record-name">{rec.productName}</div>
                      {rec.notes && (
                        <div className="record-notes">{rec.notes}</div>
                      )}
                    </div>
                  </div>
                  <div className="record-detail">
                    <div className="record-qty">{rec.quantity}x</div>
                    <div className="record-total">
                      {formatRupiah(rec.totalPrice)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
