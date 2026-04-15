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
        <div className="auth-page">
            <section className="auth-card">
                <div className="actions-row" style={{ justifyContent: 'center' }}>
                    <img src="/devday-logo.png" alt="DevDay logo" style={{ width: 34, height: 50, objectFit: 'contain' }} />
                </div>
                <div className="auth-headline">
                    <p className="eyebrow">Devday 2026 | Portal Access</p>
                    <h1 className="auth-title">Participant Login</h1>
                    <p className="auth-subtitle">Login with your participant credentials to access your dashboard.</p>
                </div>

                <form className="auth-form" onSubmit={onSubmit}>
                    <label>
                        Email
                        <input
                            autoComplete="email"
                            type="email"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="participant@example.com"
                        />
                    </label>

                    <label>
                        Password
                        <input
                            autoComplete="current-password"
                            type="password"
                            // required
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Enter your password"
                        />
                    </label>

                    {errorMessage ? <p className="error-banner" role="alert">{errorMessage}</p> : null}

                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Logging In...' : 'Login'}
                    </button>
                </form>

                <p className="auth-status">
                    Important: if you already joined a competition, use the same email to keep your points in one place.
                </p>

                <p className="muted tiny">
                    New participant? <Link to="/signup">Create account</Link>
                </p>
            </section>
        </div>
    )
}
