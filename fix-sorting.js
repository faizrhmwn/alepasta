const fs = require('fs');
const path = require('path');

function fixSorting(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    const sortingCode = `

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedArray = [...menuBreakdown].sort((a, b) => {
    if (!sortConfig.key) return 0
    let aVal = a[sortConfig.key]
    let bVal = b[sortConfig.key]
    if (typeof aVal === 'string') aVal = aVal.toLowerCase()
    if (typeof bVal === 'string') bVal = bVal.toLowerCase()
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return ' ↕'
    return sortConfig.direction === 'asc' ? ' ⬆' : ' ⬇'
  }`;

    content = content.replace('const menuBreakdown = data?.productBreakdown || []', 'const menuBreakdown = data?.productBreakdown || []' + sortingCode);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${filePath}`);
}

const dir = path.join(__dirname, 'client', 'src', 'pages');
fixSorting(path.join(dir, 'RekapBulanan.jsx'));
fixSorting(path.join(dir, 'RekapRentang.jsx'));
