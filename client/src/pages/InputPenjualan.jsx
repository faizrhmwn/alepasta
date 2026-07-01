import { useState, useEffect, useCallback } from 'react'
import { getProducts, getDailyRecap, postSale, deleteSale } from '../utils/api'
import {
  formatRupiah,
  formatDate,
  getCategoryBadgeClass,
  getToday,
  groupSalesByTransaction,
  formatCategoryName,
} from '../utils/format'
import { showToast } from '../utils/toast'
import './InputPenjualan.css'

export default function InputPenjualan() {
  const today = getToday()

  const [products, setProducts] = useState([])
  const [todaySales, setTodaySales] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [saleDate, setSaleDate] = useState(today)
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedToppings, setSelectedToppings] = useState([]) // Array of topping IDs
  const [orderType, setOrderType] = useState('Takeaway')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [spicyLevel, setSpicyLevel] = useState('Tidak Pedas')

  // Cart & Discount
  const [cart, setCart] = useState([])
  const [transactionDiscount, setTransactionDiscount] = useState(0)

  // Separate main products and toppings
  const mainProducts = products.filter(p => p.category !== 'topping')
  const toppingProducts = products.filter(p => p.category === 'topping')

  // Group main products by category
  const groupedProducts = mainProducts.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
  }, {})

  const selectedProductData = mainProducts.find(
    (p) => p.id === Number(selectedProduct)
  )

  // Calculate toppings price
  const currentToppingsPrice = selectedToppings.reduce((sum, toppingId) => {
    const topping = toppingProducts.find(t => t.id === toppingId)
    return sum + (topping ? topping.price : 0)
  }, 0)

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

  function toggleTopping(toppingId) {
    setSelectedToppings(prev => 
      prev.includes(toppingId) 
        ? prev.filter(id => id !== toppingId)
        : [...prev, toppingId]
    )
  }

  function addToCart() {
    if (!selectedProductData) {
      showToast('Pilih produk terlebih dahulu', 'error')
      return
    }
    if (quantity < 1) {
      showToast('Jumlah minimal 1', 'error')
      return
    }

    // Prepare modifiers for notes
    let modifiers = []
    
    if (selectedProductData.category.toLowerCase() === 'pasta' && spicyLevel !== 'Tidak Pedas') {
      modifiers.push(`Pedas: ${spicyLevel}`)
    }

    const toppingNames = selectedToppings.map(id => {
      const t = toppingProducts.find(t => t.id === id)
      return t ? t.name : ''
    }).filter(Boolean)

    if (toppingNames.length > 0) {
      modifiers.push(`Topping: ${toppingNames.join(', ')}`)
    }

    let finalNotes = notes
    if (modifiers.length > 0) {
      const modifierText = modifiers.join(' | ')
      finalNotes = notes ? `${modifierText}. ${notes}` : modifierText
    }

    const unitPrice = selectedProductData.price + currentToppingsPrice

    const cartItem = {
      id: Date.now(),
      productId: selectedProductData.id,
      productName: selectedProductData.name,
      category: selectedProductData.category,
      unitPrice: unitPrice,
      toppingPrice: currentToppingsPrice, // For backend
      quantity,
      totalPrice: unitPrice * quantity,
      saleDate,
      orderType,
      paymentMethod,
      notes: finalNotes,
      displayToppings: toppingNames // purely for UI display
    }

    setCart((prev) => [...prev, cartItem])
    setQuantity(1)
    setNotes('')
    setSelectedToppings([])
    setSpicyLevel('Tidak Pedas')
    showToast(`${selectedProductData.name} ditambahkan ke keranjang`, 'success')
  }

  function removeFromCart(itemId) {
    setCart((prev) => prev.filter((item) => item.id !== itemId))
  }

  async function submitCart() {
    if (cart.length === 0) return

    setSubmitting(true)
    try {
      let discountApplied = false;
      for (const item of cart) {
        const itemDiscount = !discountApplied ? transactionDiscount : 0;
        await postSale({
          productId: item.productId,
          quantity: item.quantity,
          saleDate: item.saleDate,
          orderType: item.orderType,
          paymentMethod: item.paymentMethod,
          notes: item.notes || undefined,
          toppingPrice: item.toppingPrice || 0,
          discount: itemDiscount
        })
        discountApplied = true;
      }
      showToast(`${cart.length} penjualan berhasil disimpan! 🎉`, 'success')
      setCart([])
      setTransactionDiscount(0)
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
              <label className="form-label">Tipe Pesanan</label>
              <select
                className="form-input"
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
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
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Cash">💵 Cash / Tunai</option>
                <option value="QRIS">📱 QRIS / Transfer</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Produk</label>
              <select
                className="form-input"
                value={selectedProduct}
                onChange={(e) => {
                  setSelectedProduct(e.target.value)
                  setSelectedToppings([]) // Reset toppings when changing product
                  setSpicyLevel('Tidak Pedas') // Reset spicy level
                }}
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

            {/* Toppings Section - Only for Pasta */}
            {selectedProductData && selectedProductData.category.toLowerCase() === 'pasta' && toppingProducts.length > 0 && (
              <div className="form-group toppings-group">
                <label className="form-label">Topping (Opsional)</label>
                <div className="toppings-list">
                  {toppingProducts.map(t => (
                    <label key={t.id} className="topping-item">
                      <input 
                        type="checkbox"
                        checked={selectedToppings.includes(t.id)}
                        onChange={() => toggleTopping(t.id)}
                      />
                      <span className="topping-name">{t.name}</span>
                      <span className="topping-price">+{formatRupiah(t.price)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Spiciness Level - Only for Pasta */}
            {selectedProductData && selectedProductData.category.toLowerCase() === 'pasta' && (
              <div className="form-group">
                <label className="form-label">Level Pedas</label>
                <select
                  className="form-input"
                  value={spicyLevel}
                  onChange={(e) => setSpicyLevel(e.target.value)}
                >
                  <option value="Tidak Pedas">Tidak Pedas</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Pedas">Pedas</option>
                </select>
              </div>
            )}

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
                placeholder="Contoh: extra pedas..."
              />
            </div>

            {selectedProductData && (
              <div className="price-preview">
                <div className="preview-row">
                  <span>Harga satuan {selectedToppings.length > 0 ? '(+ Topping)' : ''}</span>
                  <span>{formatRupiah(selectedProductData.price + currentToppingsPrice)}</span>
                </div>
                <div className="preview-row">
                  <span>Jumlah</span>
                  <span>×{quantity}</span>
                </div>
                <div className="preview-row preview-total">
                  <span>Total</span>
                  <span>
                    {formatRupiah((selectedProductData.price + currentToppingsPrice) * quantity)}
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
                          {item.displayToppings && item.displayToppings.length > 0 && (
                            <span className="cart-item-toppings">
                              <br/>(+ {item.displayToppings.join(', ')})
                            </span>
                          )}
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
                <div className="cart-total" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                  <span>Subtotal</span>
                  <span>{formatRupiah(cartTotal)}</span>
                </div>
                
                <div className="form-group" style={{ margin: '1rem 0' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Diskon Transaksi (Rp)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={transactionDiscount || ''}
                    onChange={(e) => setTransactionDiscount(Math.max(0, Number(e.target.value)))}
                    min="0"
                    placeholder="0"
                  />
                </div>

                <div className="cart-total" style={{ color: 'var(--accent-primary)', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  <span>Total Akhir</span>
                  <span>{formatRupiah(Math.max(0, cartTotal - transactionDiscount))}</span>
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
                      {groupSalesByTransaction(todaySales.records).map((group, groupIdx) => {
                        const firstSale = group[0]
                        const totalGroupPrice = group.reduce((sum, s) => sum + s.totalPrice, 0)
                        const totalGroupDiscount = group.reduce((sum, s) => sum + (s.discount || 0), 0)
                        return (
                          <div key={groupIdx} style={{ display: 'contents' }}>
                            <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                              <td colSpan="3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '8px 12px' }}>
                                <span className="order-type-badge">{firstSale.orderType || 'Dine-in'}</span>
                                <span className="order-type-badge" style={{ marginLeft: '4px', background: firstSale.paymentMethod === 'QRIS' ? '#8E44AD' : '#27AE60' }}>
                                  {firstSale.paymentMethod || 'Cash'}
                                </span>
                                <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#9CA3AF' }}>
                                  {new Date(firstSale.createdAt).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                                </span>
                                {totalGroupDiscount > 0 && (
                                  <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: 'var(--red)', fontWeight: 'bold' }}>
                                    (Diskon: {formatRupiah(totalGroupDiscount)})
                                  </span>
                                )}
                              </td>
                              <td style={{ fontWeight: 'bold', color: 'var(--red)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '8px 12px' }}>
                                {formatRupiah(totalGroupPrice)}
                              </td>
                              <td style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}></td>
                            </tr>
                            {group.map((sale) => (
                              <tr key={sale.id}>
                                <td style={{ paddingLeft: '24px' }}>
                                  {sale.productName}
                                  {sale.notes && (sale.notes.includes('Topping:') || sale.notes.includes('Pedas:')) && (
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                          {sale.notes}
                                      </div>
                                  )}
                                </td>
                                <td>
                                  <span
                                    className={`badge ${getCategoryBadgeClass(sale.category)}`}
                                  >
                                    {formatCategoryName(sale.category)}
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
                          </div>
                        )
                      })}
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
