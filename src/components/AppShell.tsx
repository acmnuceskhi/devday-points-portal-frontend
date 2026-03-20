import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'My Competitions', to: '/my-competitions' },
  { label: 'Explore Competitions', to: '/competitions' },
  { label: 'Rankings', to: '/rankings' },
]

export function AppShell() {
  const { participant, logout } = useAuth()
  const navigate = useNavigate()

  const onLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="portal-frame">
      <header className="topbar">
        <div>
          <p className="eyebrow">Devday Participant Portal</p>
          <h1>Welcome, {participant?.fullName || 'Participant'}</h1>
        </div>
        <button className="outline-button" onClick={onLogout}>
          Log Out
        </button>
      </header>

      <nav className="tabs" aria-label="Portal navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => (isActive ? 'tab active' : 'tab')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  )
}
