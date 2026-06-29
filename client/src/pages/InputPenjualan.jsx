import { useState, useEffect, useCallback } from 'react'
import { getProducts, getDailyRecap, postSale, deleteSale } from '../utils/api'
import {
  formatRupiah,
  formatDate,
  getCategoryBadgeClass,
} from '../utils/format'
import { showToast } from '../utils/toast'
import './InputPenjualan.css'

export default function InputPenjualan() {
  const today = new Date().toISOString().split('T')[0]

  const [products, setProducts] = useState([])
  const [todaySales, setTodaySales] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [saleDate, setSaleDate] = useState(today)
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')

  // Cart
  const [cart, setCart] = useState([])

  // Group products by category
  const groupedProducts = products.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
  }, {})

  const selectedProductData = products.find(
    (p) => p.id === Number(selectedProduct)
  )

  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0)

  const fetchTodaySales = useCallback(() => {
    getDailyRecap(today)
      .then(setTodaySales)
      .catch(() => {})
  }, [today])

  useEffect(() => {
    Promise.all([getProducts(), getDailyRecap(today)])
      .then(([prods, sales]) => {
        setProducts(prods)
        setTodaySales(sales)
      })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false))
  }, [today])

  function addToCart() {
    if (!selectedProductData) {
      showToast('Pilih produk terlebih dahulu', 'error')
      return
    }
    if (quantity < 1) {
      showToast('Jumlah minimal 1', 'error')
      return
    }

    const cartItem = {
      id: Date.now(),
      productId: selectedProductData.id,
      productName: selectedProductData.name,
      category: selectedProductData.category,
      unitPrice: selectedProductData.price,
      quantity,
      totalPrice: selectedProductData.price * quantity,
      saleDate,
      notes,
    }

    setCart((prev) => [...prev, cartItem])
    setQuantity(1)
    setNotes('')
    showToast(`${selectedProductData.name} ditambahkan ke keranjang`, 'success')
  }

  function removeFromCart(itemId) {
    setCart((prev) => prev.filter((item) => item.id !== itemId))
  }

  async function submitCart() {
    if (cart.length === 0) return

    setSubmitting(true)
    try {
      for (const item of cart) {
        await postSale({
          productId: item.productId,
          quantity: item.quantity,
          saleDate: item.saleDate,
          notes: item.notes || undefined,
        })
      }
      showToast(`${cart.length} penjualan berhasil disimpan! 🎉`, 'success')
      setCart([])
      fetchTodaySales()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteSale(id) {
    if (!window.confirm('Hapus penjualan ini?')) return
    try {
      await deleteSale(id)
      showToast('Penjualan dihapus', 'success')
      fetchTodaySales()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  if (loading) {
    return (
      <div className="animate-in">
        <div className="input-page">
          <div className="input-col">
            <div className="skeleton skeleton-card" style={{ height: 400 }} />
          </div>
          <div className="input-col">
            <div className="skeleton skeleton-card" style={{ height: 400 }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in">
      <div className="input-page">
        {/* Left Column - Input Form */}
        <div className="input-col">
          <div className="glass-card input-form-card">
            <h3 className="input-section-title">🛒 Tambah Penjualan</h3>

            <div className="form-group">
              <label className="form-label">Tanggal</label>
              <input
                type="date"
                className="form-input"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Produk</label>
              <select
                className="form-input"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <option value="">-- Pilih Produk --</option>
                {Object.entries(groupedProducts).map(([cat, items]) => (
                  <optgroup key={cat} label={`📁 ${cat}`}>
                    {items.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {formatRupiah(p.price)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Jumlah</label>
              <div className="quantity-control">
                <button
                  className="qty-btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  type="button"
                >
                  −
                </button>
                <input
                  type="number"
                  className="form-input qty-input"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, Number(e.target.value)))
                  }
                  min="1"
                />
                <button
                  className="qty-btn"
                  onClick={() => setQuantity((q) => q + 1)}
                  type="button"
                >
                  +
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Catatan (opsional)</label>
              <textarea
                className="form-input form-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Contoh: extra sauce, tanpa pedas..."
              />
            </div>

            {selectedProductData && (
              <div className="price-preview">
                <div className="preview-row">
                  <span>Harga satuan</span>
                  <span>{formatRupiah(selectedProductData.price)}</span>
                </div>
                <div className="preview-row">
                  <span>Jumlah</span>
                  <span>×{quantity}</span>
                </div>
                <div className="preview-row preview-total">
                  <span>Total</span>
                  <span>
                    {formatRupiah(selectedProductData.price * quantity)}
                  </span>
                </div>
              </div>
            )}

            <button
              className="btn btn-ghost btn-add-cart"
              onClick={addToCart}
              type="button"
            >
              + Tambah ke Keranjang
            </button>

            {/* Cart */}
            {cart.length > 0 && (
              <div className="cart-section">
                <h4 className="cart-title">
                  🧾 Keranjang{' '}
                  <span className="cart-count">{cart.length}</span>
                </h4>
                <ul className="cart-list">
                  {cart.map((item) => (
                    <li key={item.id} className="cart-item">
                      <div className="cart-item-info">
                        <span className="cart-item-name">
                          {item.productName}
                        </span>
                        <span className="cart-item-detail">
                          {item.quantity}× {formatRupiah(item.unitPrice)} ={' '}
                          {formatRupiah(item.totalPrice)}
                        </span>
                      </div>
                      <button
                        className="cart-remove"
                        onClick={() => removeFromCart(item.id)}
                        type="button"
                        title="Hapus"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="cart-total">
                  <span>Total Keranjang</span>
                  <span>{formatRupiah(cartTotal)}</span>
                </div>
                <button
                  className="btn btn-primary btn-submit-all"
                  onClick={submitCart}
                  disabled={submitting}
                  type="button"
                >
                  {submitting
                    ? '⏳ Menyimpan...'
                    : `✅ Submit Semua (${cart.length} item)`}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Today's Sales */}
        <div className="input-col">
          <div className="glass-card">
            <h3 className="input-section-title">
              📋 Penjualan Hari Ini
              <span className="today-date">{formatDate(today)}</span>
            </h3>

            {todaySales?.records?.length > 0 ? (
              <>
                <div className="table-wrapper">
                  <table className="glass-table">
                    <thead>
                      <tr>
                        <th>Produk</th>
                        <th>Kategori</th>
                        <th>Qty</th>
                        <th>Total</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todaySales.records.map((sale) => (
                        <tr key={sale.id}>
                          <td>{sale.productName}</td>
                          <td>
                            <span
                              className={`badge ${getCategoryBadgeClass(sale.category)}`}
                            >
                              {sale.category}
                            </span>
                          </td>
                          <td>{sale.quantity}</td>
                          <td>{formatRupiah(sale.totalPrice)}</td>
                          <td>
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteSale(sale.id)}
                              title="Hapus"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="today-summary">
                  <div className="today-summary-item">
                    <span>Total Item</span>
                    <span>{todaySales.summary?.totalItems || 0}</span>
                  </div>
                  <div className="today-summary-item today-summary-total">
                    <span>Total Pendapatan</span>
                    <span>
                      {formatRupiah(todaySales.summary?.totalRevenue)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <p>Belum ada penjualan hari ini</p>
                <p className="empty-state-sub">
                  Tambahkan penjualan lewat form di sebelah kiri
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
