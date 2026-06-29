import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import InputPenjualan from './pages/InputPenjualan'
import RekapHarian from './pages/RekapHarian'
import RekapBulanan from './pages/RekapBulanan'
import Grafik from './pages/Grafik'
import KelolaMenu from './pages/KelolaMenu'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/input" element={<InputPenjualan />} />
          <Route path="/rekap-harian" element={<RekapHarian />} />
          <Route path="/rekap-bulanan" element={<RekapBulanan />} />
          <Route path="/grafik" element={<Grafik />} />
          <Route path="/kelola-menu" element={<KelolaMenu />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
