import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
    { label: 'Dashboard', to: '/' },
    // { label: 'My Competitions', to: '/my-competitions' },
    { label: 'Points/Activities', to: '/points' },
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

    const renderMobileIcon = (path: string) => {
        const isActive = location.pathname === path
        const baseClass = isActive ? 'text-[#ff2a2f]' : 'text-[#b8b8c2]'

        if (path === '/') {
            return (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" className={baseClass} aria-hidden="true">
                    <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        }

        if (path === '/points') {
            return (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" className={baseClass} aria-hidden="true">
                    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        }

        return (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" className={baseClass} aria-hidden="true">
                <path d="M8 21h8M12 17v4M6.5 4h11l-1.5 5a4 4 0 0 1-4 3H12a4 4 0 0 1-4-3L6.5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    }

    return (
        <div className="portal-frame">
            <header className="topbar border-b border-[#27272f] bg-[#0d0d11]/90 backdrop-blur">
                <div className="topbar-inner">
                    <div className="actions-row portal-title-wrap">
                        <img
                            src="/devday-logo.png"
                            alt="DevDay logo"
                            className="portal-heading-logo h-12 w-8 object-contain md:h-18 md:w-13"
                        />
                        <div className="portal-title-block text-left">
                            <p className="eyebrow hidden md:block">DEVDAY '26</p>
                            <h1 className="hidden text-xl leading-tight tracking-[0.02em] text-white md:block">
                                Participant Portal
                            </h1>
                            <p className="text-sm  uppercase tracking-[0.08em] text-white md:hidden">
                                DevDay Portal
                            </p>
                        </div>
                    </div>

                    <button
                        className="outline-button logout-button border-[#3a3a43] bg-transparent/40 px-2 py-2 hover:bg-[#1b1b20] md:px-3"
                        onClick={onLogout}
                        aria-label="Logout"
                    >
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
                        <span className="logout-label text-xs uppercase tracking-[0.08em]">Logout</span>
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

            <nav
                className="fixed inset-x-0 bottom-0 z-40 border-t border-[#2d2d36] bg-[#0b0b10]/95 backdrop-blur md:hidden"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.35rem)' }}
                aria-label="Mobile portal navigation"
            >
                <div className="grid grid-cols-3 items-center px-2 pt-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-[11px] font-semibold tracking-[0.04em] transition ${isActive ? 'text-[#ff2a2f]' : 'text-[#b8b8c2] hover:text-white'
                                }`
                            }
                        >
                            {renderMobileIcon(item.to)}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>

            <main className="page-content pb-28 md:pb-0">
                <Outlet />
                <div
                    className="md:hidden"
                    style={{ height: 'calc(5.75rem + env(safe-area-inset-bottom))' }}
                    aria-hidden="true"
                />
            </main>
        </div>
    )
}
