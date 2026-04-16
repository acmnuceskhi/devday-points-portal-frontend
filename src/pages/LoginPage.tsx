import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
    const { isAuthenticated, login } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true })
        }
    }, [isAuthenticated, navigate])

    useEffect(() => {
        const initialEmail = searchParams.get('email')?.trim() || ''
        if (initialEmail) {
            setEmail(initialEmail)
        }
    }, [searchParams])

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setErrorMessage('')
        setIsSubmitting(true)

        try {
            await login(email.trim(), password)
            navigate('/', { replace: true })
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Login failed')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="auth-page px-5 md:px-0">
            <section className="mx-auto w-full max-w-xl space-y-6 rounded-xl border border-[#2f2f3a] bg-[#0e0e14]/90 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.35)] md:p-7">
                <div className="space-y-2 border-b border-[#2a2a34] pb-4">
                    <div className="flex justify-center items-center gap-3">
                        <img src="/devday-logo.png" alt="DevDay logo" className="h-11 w-7 object-contain" />
                        <p className="text-[11px] uppercase tracking-[0.16em] text-[#b8b8c2]">Devday 2026 | Portal Access</p>
                    </div>
                    <h1 className="text-2xl text-center font-bold leading-tight text-white md:text-3xl">Participant Login</h1>
                    {/* <p className="text-sm text-[#a9a9b4]">Login with your participant credentials to access your dashboard.</p> */}
                </div>

                <form className="space-y-4" onSubmit={onSubmit}>
                    <label className="grid gap-2 text-sm text-[#c9c9d3]">
                        <span>Email</span>
                        <input
                            autoComplete="email"
                            type="email"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="participant@example.com"
                            className="w-full rounded-md border border-[#383844] bg-transparent px-4 py-3 text-sm text-white placeholder:text-[#8f8f9a] focus:border-[#ff2a2f] focus:outline-none"
                        />
                    </label>

                    <label className="grid gap-2 text-sm text-[#c9c9d3]">
                        <span>Password</span>
                        <input
                            autoComplete="current-password"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Enter your password"
                            className="w-full rounded-md border border-[#383844] bg-transparent px-4 py-3 text-sm text-white placeholder:text-[#8f8f9a] focus:border-[#ff2a2f] focus:outline-none"
                        />
                    </label>

                    {errorMessage ? <p className="error-banner" role="alert">{errorMessage}</p> : null}

                    <button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-[#ff2a2f] px-4 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-[#ea1e24] disabled:cursor-not-allowed disabled:opacity-70">
                        {isSubmitting ? 'Logging In...' : 'Login'}
                    </button>
                </form>

                <p className="text-sm text-red-500">
                    Important: if you already joined a competition, use the same email to keep your points in one place.
                </p>

                <p className="text-xs text-[#a9a9b4]">
                    New participant? <Link to="/signup" className="text-[#ff7d80] hover:text-[#ff2a2f]">Create account</Link>
                </p>
            </section>
        </div>
    )
}
