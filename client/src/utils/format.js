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
  if (!category) return '#E67E22'
  const c = category.toString().toLowerCase().replace(/[^a-z0-9]/g, '')
  const colors = {
    pasta: '#E67E22',
    rice: '#F1C40F',
    salad: '#27AE60',
    side: '#E74C3C',
    beverage: '#3498DB',
    alacarte: '#9B59B6',
    topping: '#95A5A6'
  }
  return colors[c] || '#E67E22'
}

export function getCategoryBg(category) {
  const color = getCategoryColor(category)
  return color + '20'
}

export function getCategoryBadgeClass(category) {
  if (!category) return 'badge-pasta'
  const c = category.toString().toLowerCase().replace(/[^a-z0-9]/g, '')
  if (c === 'pasta') return 'badge-pasta'
  if (c === 'rice') return 'badge-rice'
  if (c === 'salad') return 'badge-salad'
  if (c === 'side') return 'badge-side'
  if (c === 'beverage') return 'badge-beverage'
  if (c === 'alacarte') return 'badge-alacarte'
  if (c === 'topping') return 'badge-topping'
  return 'badge-pasta'
}

export function groupSalesByTransaction(sales) {
  const grouped = []
  if (!sales || sales.length === 0) return grouped

  let currentGroup = []
  sales.forEach((sale) => {
    if (currentGroup.length === 0) {
      currentGroup.push(sale)
    } else {
      const lastSale = currentGroup[0]
      const timeDiff = Math.abs(new Date(lastSale.createdAt) - new Date(sale.createdAt))
      if (
        timeDiff < 10000 &&
        lastSale.orderType === sale.orderType &&
        lastSale.paymentMethod === sale.paymentMethod &&
        lastSale.saleDate === sale.saleDate
      ) {
        currentGroup.push(sale)
      } else {
        grouped.push(currentGroup)
        currentGroup = [sale]
      }
    }
  })
  if (currentGroup.length > 0) {
    grouped.push(currentGroup)
  }
  return grouped
}
