import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
    { label: 'Console', to: '/' },
    { label: 'Main Missions', to: '/my-competitions' },
    { label: 'Signal Score', to: '/points' },
    { label: 'Leaderboard', to: '/rankings' },
]

export function AppShell() {
    const { logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const onLogout = () => {
        logout()
        navigate('/login', { replace: true })
    }

    const onMobileNavChange = (value: string) => {
        navigate(value)
    }

    return (
        <div className="portal-frame">
            <header className="topbar">
                <div className="topbar-inner">
                    <div className="actions-row portal-title-wrap">
                        <img
                            src="/devday-logo.png"
                            alt="DevDay logo"
                            className="portal-heading-logo"
                            style={{ width: 52, height: 72, objectFit: 'contain' }}
                        />
                        <div className="portal-title-block">
                            <p className="eyebrow">DEVDAY '26 | VR SIMULATION</p>
                            <h1 className="portal-title-main main-heading">VR Operator Console</h1>
                        </div>
                    </div>

                    <button className="outline-button logout-button" onClick={onLogout} aria-label="End session">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
                            <path
                                d="M14 7V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-3"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M10 12h11m0 0-3-3m3 3-3 3"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <span className="logout-label">End Session</span>
                    </button>
                </div>
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

            <div className="tabs-mobile">
                <label className="tabs-mobile-label" htmlFor="mobile-page-nav">
                    <span>Navigation</span>
                    <select
                        id="mobile-page-nav"
                        value={location.pathname}
                        onChange={(event) => onMobileNavChange(event.target.value)}
                    >
                        <option value="/">Console</option>
                        <option value="/my-competitions">Main Missions</option>
                        <option value="/points">Signal Score</option>
                        <option value="/rankings">Leaderboard</option>
                    </select>
                </label>
            </div>

            <main className="page-content">
                <Outlet />
            </main>
        </div>
    )
}
