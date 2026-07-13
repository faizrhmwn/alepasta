import { NavLink, useNavigate } from 'react-router-dom'
import './Sidebar.css'

const navItems = [
  { path: '/', icon: '📊', label: 'Dashboard' },
  { path: '/input', icon: '➕', label: 'Input Penjualan' },
  { path: '/rekap-harian', icon: '📋', label: 'Rekap Harian' },
  { path: '/rekap-bulanan', icon: '📅', label: 'Rekap Bulanan' },
  { path: '/bagi-hasil', icon: '💰', label: 'Bagi Hasil' },
  { path: '/grafik', icon: '📈', label: 'Grafik' },
  { path: '/kelola-menu', icon: '🍔', label: 'Kelola Menu' },
]

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <img src="/logo.png" alt="Alepasta Logo" className="sidebar-logo-img" />
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
              onClick={onClose}
            >
              <span className="nav-link-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {(user.name || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name || 'Admin'}</div>
              <div className="sidebar-user-role">
                {user.role || 'Administrator'}
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  )
}
