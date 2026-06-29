export function formatRupiah(num) {
  if (num == null) return 'Rp 0'
  return 'Rp ' + Number(num).toLocaleString('id-ID')
}

export function getToday() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateShort(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  })
}

export function formatMonth(monthStr) {
  const [y, m] = monthStr.split('-')
  return new Date(y, m - 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  })
}

export function getCategoryColor(category) {
  const colors = {
    Pasta: '#E67E22',
    Rice: '#F1C40F',
    Salad: '#27AE60',
    Side: '#E74C3C',
    Beverage: '#3498DB',
    'A La Carte': '#9B59B6',
  }
  return colors[category] || '#E67E22'
}

export function getCategoryBg(category) {
  const color = getCategoryColor(category)
  return color + '20'
}

export function getCategoryBadgeClass(category) {
  const classes = {
    Pasta: 'badge-pasta',
    Rice: 'badge-rice',
    Salad: 'badge-salad',
    Side: 'badge-side',
    Beverage: 'badge-beverage',
    'A La Carte': 'badge-alacarte',
  }
  return classes[category] || 'badge-pasta'
}
