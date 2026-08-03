import { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
import { formatRupiah } from '../utils/format'
import { showToast } from '../utils/toast'
import './HitungOngkir.css'

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
});
L.Marker.prototype.options.icon = DefaultIcon;

const ALEPASTA_COORD = { lat: -7.3800269, lng: 109.7418411 }

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng)
    },
  })
  return null
}

export default function HitungOngkir() {
  const [mapDestination, setMapDestination] = useState(null)
  const [distanceStr, setDistanceStr] = useState('')
  const [calculatedFee, setCalculatedFee] = useState(0)
  const [calculatingRoute, setCalculatingRoute] = useState(false)

  async function calculateDistance(latlng) {
    setMapDestination(latlng)
    setCalculatingRoute(true)
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${ALEPASTA_COORD.lng},${ALEPASTA_COORD.lat};${latlng.lng},${latlng.lat}?overview=false`)
      const data = await res.json()
      if (data.code === 'Ok' && data.routes.length > 0) {
        const distanceMeters = data.routes[0].distance
        const distanceKm = distanceMeters / 1000
        
        setDistanceStr(distanceKm.toFixed(2) + ' km')
        
        if (distanceKm <= 3) {
          setCalculatedFee(0)
        } else {
          const extraKm = Math.ceil(distanceKm - 3)
          setCalculatedFee(extraKm * 2500)
        }
      } else {
        showToast('Gagal menghitung rute', 'error')
      }
    } catch (err) {
      showToast('Error jaringan saat menghitung jarak', 'error')
    } finally {
      setCalculatingRoute(false)
    }
  }

  return (
    <div className="animate-in ongkir-page">
      <div className="ongkir-header">
        <h2 className="ongkir-title">📍 Kalkulator Ongkir</h2>
        <p className="ongkir-subtitle">Tap pada peta untuk mengetahui jarak dan ongkos kirim pesanan Delivery.</p>
      </div>

      <div className="glass-card ongkir-card">
        <div className="ongkir-map-wrapper">
          <MapContainer 
            center={[ALEPASTA_COORD.lat, ALEPASTA_COORD.lng]} 
            zoom={14} 
            style={{ height: '100%', width: '100%', zIndex: 1 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[ALEPASTA_COORD.lat, ALEPASTA_COORD.lng]}>
              <Popup>Lokasi Alepasta</Popup>
            </Marker>
            {mapDestination && (
              <Marker position={[mapDestination.lat, mapDestination.lng]}>
                <Popup>Lokasi Tujuan</Popup>
              </Marker>
            )}
            <MapClickHandler onLocationSelect={calculateDistance} />
          </MapContainer>
        </div>

        {mapDestination ? (
          <div className="ongkir-result-box">
            <div className="ongkir-row">
              <span>Jarak Tempuh (Rute):</span>
              <span>{calculatingRoute ? 'Menghitung...' : distanceStr}</span>
            </div>
            <div className="ongkir-row">
              <span>Ketentuan Tarif:</span>
              <span>3km pertama gratis, selanjutnya Rp 2.500/km</span>
            </div>
            <div className="ongkir-row total">
              <span>Total Ongkos Kirim:</span>
              <span>{calculatingRoute ? '...' : formatRupiah(calculatedFee)}</span>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
            <p>Pilih titik lokasi tujuan pelanggan di peta.</p>
          </div>
        )}
      </div>
    </div>
  )
}
