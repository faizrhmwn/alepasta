import { useState, useEffect } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { getChartData } from '../utils/api'
import {
  formatRupiah,
  formatDateShort,
  getCategoryColor,
} from '../utils/format'
import { showToast } from '../utils/toast'
import './Grafik.css'

function CustomTooltip({ active, payload, label, viewMode }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{formatDateShort(label)}</p>
      <p className="tooltip-value">
        {viewMode === 'revenue'
          ? formatRupiah(payload[0]?.value)
          : `${payload[0]?.value} item`}
      </p>
      {payload[0]?.payload?.items != null && viewMode === 'revenue' && (
        <p className="tooltip-sub">{payload[0].payload.items} item</p>
      )}
    </div>
  )
}

function BarTooltip({ active, payload, viewMode }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{d?.productName}</p>
      <p className="tooltip-value">
        {viewMode === 'revenue'
          ? formatRupiah(d?.revenue)
          : `${d?.quantity} item`}
      </p>
    </div>
  )
}

export default function Grafik() {
  const today = new Date()
  const defaultFrom = new Date(today)
  defaultFrom.setDate(defaultFrom.getDate() - 6)

  const [dateFrom, setDateFrom] = useState(
    defaultFrom.toISOString().split('T')[0]
  )
  const [dateTo, setDateTo] = useState(today.toISOString().split('T')[0])
  const [viewMode, setViewMode] = useState('revenue')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getChartData(dateFrom, dateTo)
      .then(setData)
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false))
  }, [dateFrom, dateTo])

  function setPreset(days) {
    const to = new Date()
    const from = new Date(to)
    from.setDate(from.getDate() - (days - 1))
    setDateFrom(from.toISOString().split('T')[0])
    setDateTo(to.toISOString().split('T')[0])
  }

  const dailyData = data?.daily || []
  const byProduct = data?.byProduct || []
  const dataKey = viewMode === 'revenue' ? 'revenue' : 'items'
  const chartColor = viewMode === 'revenue' ? '#E67E22' : '#3498DB'

  return (
    <div className="animate-in">
      <div className="glass-card grafik-filter">
        <div className="grafik-filter-group">
          <span className="grafik-filter-label">Dari:</span>
          <input
            type="date"
            className="form-input"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ width: 'auto' }}
          />
        </div>
        <div className="grafik-filter-group">
          <span className="grafik-filter-label">Sampai:</span>
          <input
            type="date"
            className="form-input"
            value={dateTo}
            max={today.toISOString().split('T')[0]}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ width: 'auto' }}
          />
        </div>
        <div className="grafik-presets">
          <button className="btn btn-ghost btn-sm" onClick={() => setPreset(7)}>
            7 Hari
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setPreset(30)}
          >
            30 Hari
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setPreset(90)}
          >
            3 Bulan
          </button>
        </div>
        <div className="grafik-toggle">
          <button
            className={`grafik-toggle-btn ${viewMode === 'revenue' ? 'active' : ''}`}
            onClick={() => setViewMode('revenue')}
          >
            Revenue
          </button>
          <button
            className={`grafik-toggle-btn ${viewMode === 'quantity' ? 'active' : ''}`}
            onClick={() => setViewMode('quantity')}
          >
            Quantity
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grafik-charts">
          <div
            className="skeleton"
            style={{ height: 400, borderRadius: 'var(--radius-lg)' }}
          />
          <div
            className="skeleton"
            style={{ height: 400, borderRadius: 'var(--radius-lg)' }}
          />
        </div>
      ) : (
        <div className="grafik-charts">
          <div className="glass-card">
            <h3 className="grafik-chart-title">📈 Tren Penjualan Harian</h3>
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient
                      id="chartGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={chartColor}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={chartColor}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateShort}
                    stroke="#606070"
                    fontSize={12}
                  />
                  <YAxis
                    tickFormatter={(v) =>
                      viewMode === 'revenue'
                        ? `${(v / 1000).toFixed(0)}k`
                        : v
                    }
                    stroke="#606070"
                    fontSize={12}
                  />
                  <Tooltip
                    content={<CustomTooltip viewMode={viewMode} />}
                  />
                  <Area
                    type="monotone"
                    dataKey={dataKey}
                    stroke={chartColor}
                    strokeWidth={2}
                    fill="url(#chartGradient)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <p>Tidak ada data untuk rentang tanggal ini</p>
              </div>
            )}
          </div>

          <div className="glass-card">
            <h3 className="grafik-chart-title">🏆 Top Menu Terlaris</h3>
            {byProduct.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={byProduct}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    type="number"
                    tickFormatter={(v) =>
                      viewMode === 'revenue'
                        ? `${(v / 1000).toFixed(0)}k`
                        : v
                    }
                    stroke="#606070"
                    fontSize={12}
                  />
                  <YAxis
                    type="category"
                    dataKey="productName"
                    width={120}
                    stroke="#606070"
                    fontSize={12}
                  />
                  <Tooltip
                    content={<BarTooltip viewMode={viewMode} />}
                  />
                  <Bar
                    dataKey={dataKey}
                    radius={[0, 6, 6, 0]}
                    animationDuration={1500}
                  >
                    {byProduct.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={getCategoryColor(entry.category)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <p>Tidak ada data</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
