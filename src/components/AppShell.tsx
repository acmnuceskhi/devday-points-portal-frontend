import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
    { label: 'Console', to: '/' },
    { label: 'My Missions', to: '/my-competitions' },
    { label: 'Mission Grid', to: '/competitions' },
    { label: 'Signal Score', to: '/points' },
    { label: 'Leaderboard', to: '/rankings' },
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
                <div className="actions-row portal-title-wrap">
                    <img
                        src="/devday-logo.png"
                        alt="DevDay logo"
                        className="portal-heading-logo"
                        style={{ width: 52, height: 72, objectFit: 'contain' }}
                    />
                    <div className="portal-title-block">
                        <p className="eyebrow">DEVDAY '26 | VR SIMULATION</p>
                        <h1 className="portal-title-main">Operator Console</h1>
                        <p className="muted tiny">Signed in as {participant?.fullName || 'Operator'}</p>
                    </div>
                </div>
                <button className="outline-button" onClick={onLogout}>
                    End Session
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
