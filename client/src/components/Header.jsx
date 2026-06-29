import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { formatDate, getToday } from '../utils/format'
import './Header.css'

export default function Header({ title, onMenuToggle }) {
  const location = useLocation()
  const today = getToday()

  const [theme, setTheme] = useState(
    localStorage.getItem('alepasta-theme') || 'light'
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('alepasta-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <header className="header">
      <div className="header-left">
        <button className="header-menu-btn" onClick={onMenuToggle}>
          ☰
        </button>
        <h1 className="header-title">{title}</h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          onClick={toggleTheme} 
          className="btn btn-ghost" 
          style={{ padding: '0.4rem 0.6rem', fontSize: '1.2rem', borderRadius: '50%' }}
          title="Toggle Dark Mode"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <div className="header-date">{formatDate(today)}</div>
      </div>
    </header>
  )
}
