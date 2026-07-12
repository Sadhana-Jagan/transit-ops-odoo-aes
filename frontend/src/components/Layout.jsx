import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useApp } from '../store/AppContext.jsx'
import { ROLES } from '../store/seed.js'
import {
  FiGrid, FiTruck, FiUsers, FiMap, FiTool, FiDroplet, FiTrendingUp,
  FiRefreshCw, FiLogOut, FiMoon, FiSun, FiMenu,
} from './icons.jsx'

const NAV = [
  { to: '/', route: 'dashboard', label: 'Dashboard', Icon: FiGrid },
  { to: '/vehicles', route: 'vehicles', label: 'Vehicles', Icon: FiTruck },
  { to: '/drivers', route: 'drivers', label: 'Drivers', Icon: FiUsers },
  { to: '/trips', route: 'trips', label: 'Trips', Icon: FiMap },
  { to: '/maintenance', route: 'maintenance', label: 'Maintenance', Icon: FiTool },
  { to: '/fuel', route: 'fuel', label: 'Fuel & Expenses', Icon: FiDroplet },
  { to: '/reports', route: 'reports', label: 'Reports', Icon: FiTrendingUp },
]

const TITLES = {
  '/': 'Dashboard', '/vehicles': 'Vehicle Registry', '/drivers': 'Driver Management',
  '/trips': 'Trip Management', '/maintenance': 'Maintenance', '/fuel': 'Fuel & Expenses', '/reports': 'Reports & Analytics',
}

export default function Layout({ children }) {
  const { user, logout, theme, setTheme, can, reset } = useApp()
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  const initials = user.name.split(' ').map((s) => s[0]).join('').slice(0, 2)

  return (
    <div className="layout">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <img src="/logo.svg" alt="" /> TransitOps
        </div>
        <nav className="nav">
          <div className="sec">Operations</div>
          {NAV.filter((n) => can(n.route)).map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} onClick={() => setOpen(false)}
              className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="ic"><n.Icon /></span> {n.label}
            </NavLink>
          ))}
          <div className="sec">Account</div>
          <a onClick={reset} style={{ cursor: 'pointer' }}><span className="ic"><FiRefreshCw /></span> Refresh Data</a>
          <a onClick={logout} style={{ cursor: 'pointer' }}><span className="ic"><FiLogOut /></span> Sign Out</a>
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="icon-btn hamburger" onClick={() => setOpen((o) => !o)}><FiMenu /></button>
            <h1>{TITLES[loc.pathname] || 'TransitOps'}</h1>
          </div>
          <div className="right">
            <button className="icon-btn" title="Toggle theme" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? <FiMoon /> : <FiSun />}
            </button>
            <div className="user-chip">
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</div>
                <small>{ROLES[user.role]}</small>
              </div>
              <div className="avatar">{initials}</div>
            </div>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  )
}

