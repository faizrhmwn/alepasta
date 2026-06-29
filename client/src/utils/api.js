const BASE_URL = import.meta.env.VITE_API_URL || '/api'

async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem('token')
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  }
  const res = await fetch(`${BASE_URL}${endpoint}`, config)
  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    return
  }
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Terjadi kesalahan')
  return data.data
}

export function login(username, password) {
  return fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

// ── Products ─────────────────────────────────────────────────────────────

export function getProducts(includeAll = false) {
  const query = includeAll ? '?all=true' : ''
  return fetchAPI(`/products${query}`)
}

export function createProduct(data) {
  return fetchAPI('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateProduct(id, data) {
  return fetchAPI(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function toggleProductActive(id, isActive) {
  return fetchAPI(`/products/${id}/toggle`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  })
}

// ── Sales ────────────────────────────────────────────────────────────────

export function getDashboard() {
  return fetchAPI('/sales/dashboard')
}

export function getDailyRecap(date) {
  return fetchAPI(`/sales/daily?date=${date}`)
}

export function getMonthlyRecap(month) {
  return fetchAPI(`/sales/monthly?month=${month}`)
}

export function getChartData(from, to) {
  return fetchAPI(`/sales/chart?from=${from}&to=${to}`)
}

export function postSale(data) {
  return fetchAPI('/sales', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function deleteSale(id) {
  return fetchAPI(`/sales/${id}`, {
    method: 'DELETE',
  })
}
