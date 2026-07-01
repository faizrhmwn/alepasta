import { useState, useEffect } from 'react'
import { getProducts, createProduct, updateProduct, toggleProductActive } from '../utils/api'
import { formatRupiah, getCategoryBadgeClass, formatCategoryName } from '../utils/format'
import { showToast } from '../utils/toast'
import './KelolaMenu.css'

export default function KelolaMenu() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Filter & Sort State
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortConfig, setSortConfig] = useState({ key: 'category', direction: 'asc' })

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ name: '', price: '', category: 'pasta' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  function fetchProducts() {
    setLoading(true)
    getProducts() // includeAll = false (hanya produk aktif)
      .then(setProducts)
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false))
  }

  function handleOpenModal(product = null) {
    if (product) {
      setEditingId(product.id)
      setFormData({ name: product.name, price: product.price, category: product.category })
    } else {
      setEditingId(null)
      setFormData({ name: '', price: '', category: 'pasta' })
    }
    setIsModalOpen(true)
  }

  function handleCloseModal() {
    setIsModalOpen(false)
    setEditingId(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.name || !formData.price) {
      showToast('Nama dan harga harus diisi', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingId) {
        await updateProduct(editingId, formData)
        showToast('Produk berhasil diperbarui', 'success')
      } else {
        await createProduct(formData)
        showToast('Produk baru berhasil ditambahkan', 'success')
      }
      handleCloseModal()
      fetchProducts()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggleActive(id, currentStatus) {
    if (!window.confirm(`Yakin ingin menghapus produk ini dari menu? (Data penjualan lama akan tetap aman)`)) return
    
    try {
      await toggleProductActive(id, !currentStatus)
      showToast(`Produk berhasil dihapus`, 'success')
      fetchProducts()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const displayedProducts = [...products]
    .filter(p => {
       if (filterCategory === 'all') return true
       const c = p.category.toString().toLowerCase().replace(/[^a-z0-9]/g, '')
       return c === filterCategory
    })
    .sort((a, b) => {
       let aVal = a[sortConfig.key]
       let bVal = b[sortConfig.key]
       
       if (typeof aVal === 'string') aVal = aVal.toLowerCase()
       if (typeof bVal === 'string') bVal = bVal.toLowerCase()
       
       if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
       if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
       return 0
    })

  const requestSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
    }
    return ''
  }

  return (
    <div className="animate-in kelola-menu-page">
      <div className="kelola-header">
        <h2 className="page-title">🍔 Kelola Menu</h2>
        <button className="btn btn-primary btn-add-menu" onClick={() => handleOpenModal()}>
          + Tambah Produk
        </button>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
         <div className="form-group" style={{ marginBottom: 0, flex: 1, maxWidth: '300px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Filter Kategori</label>
            <select className="form-input form-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
               <option value="all">Semua Kategori</option>
               <option value="alacarte">Ala Carte</option>
               <option value="beverage">Beverage</option>
               <option value="pasta">Pasta</option>
               <option value="rice">Rice</option>
               <option value="salad">Salad</option>
               <option value="side">Side</option>
               <option value="topping">Topping</option>
            </select>
         </div>
      </div>

      <div className="glass-card">
        {loading ? (
          <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-md)' }} />
        ) : (
          <div className="table-wrapper">
            <table className="glass-table">
              <thead>
                <tr>
                  <th onClick={() => requestSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Produk{getSortIndicator('name')}
                  </th>
                  <th onClick={() => requestSort('category')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Kategori{getSortIndicator('category')}
                  </th>
                  <th onClick={() => requestSort('price')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>
                    Harga{getSortIndicator('price')}
                  </th>
                  <th onClick={() => requestSort('isActive')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'center' }}>
                    Status{getSortIndicator('isActive')}
                  </th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {displayedProducts.length > 0 ? (
                  displayedProducts.map((p) => (
                    <tr key={p.id} className={!p.isActive ? 'inactive-row' : ''}>
                      <td>{p.name}</td>
                      <td>
                        <span className={`badge ${getCategoryBadgeClass(p.category)}`}>
                          {formatCategoryName(p.category)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>{formatRupiah(p.price)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`status-badge ${p.isActive ? 'active' : 'inactive'}`}>
                          {p.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons">
                          <button className="btn-action edit" onClick={() => handleOpenModal(p)} title="Edit">
                            ✏️
                          </button>
                          <button 
                            className="btn-action delete" 
                            onClick={() => handleToggleActive(p.id, p.isActive)}
                            title="Hapus"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada produk.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content animate-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{editingId ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nama Produk</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Harga (Rp)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <select 
                  className="form-input"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="alacarte">Ala Carte</option>
                  <option value="beverage">Beverage</option>
                  <option value="pasta">Pasta</option>
                  <option value="rice">Rice</option>
                  <option value="salad">Salad</option>
                  <option value="side">Side</option>
                  <option value="topping">Topping</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={handleCloseModal}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
