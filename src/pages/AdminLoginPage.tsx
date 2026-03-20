import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'

export function AdminLoginPage() {
    const { isAuthenticated, login } = useAdminAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    if (isAuthenticated) {
        return <Navigate to="/admin/points" replace />
    }

    const onSubmit = async (event: FormEvent) => {
        event.preventDefault()
        setIsSubmitting(true)
        setErrorMessage('')

        try {
            await login(email, password)
            navigate('/admin/points', { replace: true })
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to login')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="auth-page">
            <article className="auth-card">
                <div className="actions-row" style={{ justifyContent: 'center' }}>
                    <img src="/devday-logo.png" alt="DevDay logo" style={{ width: 34, height: 50, objectFit: 'contain' }} />
                </div>
                <p className="eyebrow">Devday Admin</p>
                <h2>Admin Login</h2>
                <p className="muted">Sign in with your staff account. Only approved superadmins can access.</p>

                <form className="auth-form" onSubmit={onSubmit}>
                    <label>
                        Email
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                            autoComplete="email"
                        />
                    </label>

                    <label>
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete="current-password"
                        />
                    </label>

                    {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </article>
        </div>
    )
}
