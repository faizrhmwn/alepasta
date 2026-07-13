import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import './Layout.css'

const pageTitles = {
  '/': 'Dashboard',
  '/input': 'Input Penjualan',
  '/rekap-harian': 'Rekap Harian',
  '/rekap-bulanan': 'Rekap Bulanan',
  '/bagi-hasil': 'Bagi Hasil & Modal',
  '/grafik': 'Grafik & Analisis',
  '/kelola-menu': 'Kelola Menu',
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const title = pageTitles[location.pathname] || 'Dashboard'

  return (
    <div className="layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="layout-main">
        <Header
          title={title}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
