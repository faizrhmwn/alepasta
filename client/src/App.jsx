import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import InputPenjualan from './pages/InputPenjualan'
import RekapHarian from './pages/RekapHarian'
import RekapBulanan from './pages/RekapBulanan'
import RekapRentang from './pages/RekapRentang'
import BagiHasil from './pages/BagiHasil'
import Grafik from './pages/Grafik'
import KelolaMenu from './pages/KelolaMenu'
import HitungOngkir from './pages/HitungOngkir'

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
          <Route path="/rekap-rentang" element={<RekapRentang />} />
          <Route path="/bagi-hasil" element={<BagiHasil />} />
          <Route path="/grafik" element={<Grafik />} />
          <Route path="/kelola-menu" element={<KelolaMenu />} />
          <Route path="/ongkir" element={<HitungOngkir />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
