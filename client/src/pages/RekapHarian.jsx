import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import StatCard from '../components/StatCard'
import { getDailyRecap, deleteSale, updateSale } from '../utils/api'
import {
  formatRupiah,
  formatDate,
  getCategoryBadgeClass,
} from '../utils/format'
import { showToast } from '../utils/toast'
import './RekapHarian.css'

export default function RekapHarian() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0]

  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Edit State
  const [editingSale, setEditingSale] = useState(null)
  const [editForm, setEditForm] = useState({ quantity: 1, orderType: 'Takeaway', paymentMethod: 'Cash', notes: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchRecap = () => {
    setLoading(true)
    getDailyRecap(selectedDate)
      .then(setData)
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchRecap()
  }, [selectedDate])

  function changeDate(offset) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + offset)
    const newDate = d.toISOString().split('T')[0]
    setSelectedDate(newDate)
    setSearchParams({ date: newDate }, { replace: true })
  }

  // Update URL if user changes date via input
  function handleDateChange(e) {
    const newDate = e.target.value
    setSelectedDate(newDate)
    setSearchParams({ date: newDate }, { replace: true })
  }

  const today = new Date().toISOString().split('T')[0]
  const isToday = selectedDate === today

  const summary = data?.summary || {}
  const items = data?.items || []
  const records = data?.records || []

  async function handleDelete(id) {
    if (!window.confirm('Yakin ingin menghapus data penjualan ini?')) return
    try {
      await deleteSale(id)
      showToast('Penjualan berhasil dihapus', 'success')
      fetchRecap()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  function handleEditClick(sale) {
    setEditingSale(sale)
    setEditForm({
      quantity: sale.quantity,
      orderType: sale.orderType || 'Takeaway',
      paymentMethod: sale.paymentMethod || 'Cash',
      notes: sale.notes || '',
    })
  }

  async function handleUpdateSale(e) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await updateSale(editingSale.id, editForm)
      showToast('Data penjualan berhasil diubah', 'success')
      setEditingSale(null)
      fetchRecap()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

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
          onChange={handleDateChange}
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
              icon="💵"
              title="Tunai / Cash"
              value={formatRupiah(summary.totalCash || 0)}
              delay={100}
              color="#27AE60"
            />
            <StatCard
              icon="📱"
              title="QRIS / Digital"
              value={formatRupiah(summary.totalQris || 0)}
              delay={200}
              color="#8E44AD"
            />
          </div>
          
          <div className="rekap-stats" style={{ marginTop: '1rem' }}>
            <StatCard
              icon="📦"
              title="Total Item"
              value={`${summary.totalItems || 0} item`}
              delay={300}
              color="#3498DB"
            />
            <StatCard
              icon="🧾"
              title="Total Transaksi"
              value={`${summary.totalTransactions || 0} transaksi`}
              delay={400}
              color="#E67E22"
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
                      <div className="record-name">
                        {rec.productName}
                        <span className="order-type-badge">{rec.orderType || 'Dine-in'}</span>
                        <span className="order-type-badge" style={{ marginLeft: '4px', background: rec.paymentMethod === 'QRIS' ? '#8E44AD' : '#27AE60' }}>
                          {rec.paymentMethod || 'Cash'}
                        </span>
                      </div>
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
                  <div className="record-actions" style={{ marginLeft: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-action edit" onClick={() => handleEditClick(rec)} title="Edit">
                      ✏️
                    </button>
                    <button className="btn-action delete" onClick={() => handleDelete(rec.id)} title="Hapus">
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal Edit Transaksi */}
      {editingSale && (
        <div className="modal-overlay" onClick={() => setEditingSale(null)}>
          <div className="modal-content animate-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Edit Transaksi</h3>
            <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
              Produk: <strong>{editingSale.productName}</strong>
            </p>
            <form onSubmit={handleUpdateSale}>
              <div className="form-group">
                <label className="form-label">Tipe Pesanan</label>
                <select
                  className="form-input"
                  value={editForm.orderType}
                  onChange={(e) => setEditForm({...editForm, orderType: e.target.value})}
                >
                  <option value="Takeaway">🛍️ Takeaway</option>
                  <option value="GrabFood">🛵 GrabFood</option>
                  <option value="ShopeeFood">🛵 ShopeeFood</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Metode Pembayaran</label>
                <select
                  className="form-input"
                  value={editForm.paymentMethod}
                  onChange={(e) => setEditForm({...editForm, paymentMethod: e.target.value})}
                >
                  <option value="Cash">💵 Cash</option>
                  <option value="QRIS">📱 QRIS</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Jumlah (Qty)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm({...editForm, quantity: Math.max(1, Number(e.target.value))})}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Catatan</label>
                <textarea
                  className="form-input form-textarea"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  rows={2}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setEditingSale(null)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
