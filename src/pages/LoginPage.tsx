import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

export function LoginPage() {
    const { isAuthenticated, login } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [signupEmail, setSignupEmail] = useState('')
    const [signupToken, setSignupToken] = useState(searchParams.get('token') || '')
    const [signupVerifyEmail, setSignupVerifyEmail] = useState(searchParams.get('email') || '')
    const [signupPassword, setSignupPassword] = useState('')
    const [signupConfirmPassword, setSignupConfirmPassword] = useState('')
    const [signupMessage, setSignupMessage] = useState('')
    const [signupLink, setSignupLink] = useState('')
    const [isSignupRequestSubmitting, setIsSignupRequestSubmitting] = useState(false)
    const [isSignupVerifySubmitting, setIsSignupVerifySubmitting] = useState(false)

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true })
        }
    }, [isAuthenticated, navigate])

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

    const onSignupRequest = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setSignupMessage('')
        setSignupLink('')
        setIsSignupRequestSubmitting(true)

        try {
            const result = await api.signupRequest(signupEmail.trim())
            setSignupMessage(result.message)
            if (result.signupLink) {
                setSignupLink(result.signupLink)
            }
        } catch (error) {
            setSignupMessage(error instanceof Error ? error.message : 'Could not request signup link')
        } finally {
            setIsSignupRequestSubmitting(false)
        }
    }

    const onSignupVerify = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setSignupMessage('')
        setIsSignupVerifySubmitting(true)

        try {
            const result = await api.signupVerify(
                signupVerifyEmail.trim(),
                signupToken.trim(),
                signupPassword,
                signupConfirmPassword,
            )
            setSignupMessage(result.message)
            await login(signupVerifyEmail.trim(), signupPassword)
            navigate('/', { replace: true })
        } catch (error) {
            setSignupMessage(error instanceof Error ? error.message : 'Could not verify signup')
        } finally {
            setIsSignupVerifySubmitting(false)
        }
    }

    return (
        <div className="auth-page">
            <section className="auth-card">
                <div className="actions-row" style={{ justifyContent: 'center' }}>
                    <img src="/devday-logo.png" alt="DevDay logo" style={{ width: 34, height: 50, objectFit: 'contain' }} />
                </div>
                <p className="eyebrow">Devday 2026</p>
                <h1>Participant Login</h1>
                <p className="muted">Use your participant email and existing password.</p>

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

                    {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}

                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="muted tiny">
                    API base URL can be overridden via <strong>VITE_API_BASE_URL</strong>.
                </p>
                <p className="muted tiny">
                    Need rankings without login? Go to <Link to="/rankings">Rankings</Link> after sign-in.
                </p>

                <hr />

                <section className="stack">
                    <h2 style={{ margin: 0 }}>Need To Set Up Your Password?</h2>
                    <p className="muted tiny">
                        If your email is eligible, we will create a signup verification link.
                    </p>
                    <form className="auth-form" onSubmit={onSignupRequest}>
                        <label>
                            Signup Email
                            <input
                                autoComplete="email"
                                type="email"
                                required
                                value={signupEmail}
                                onChange={(event) => setSignupEmail(event.target.value)}
                                placeholder="participant@example.com"
                            />
                        </label>
                        <button type="submit" disabled={isSignupRequestSubmitting}>
                            {isSignupRequestSubmitting ? 'Requesting...' : 'Request Signup Link'}
                        </button>
                    </form>
                    {signupLink ? (
                        <p className="tiny">
                            Dev link: <a href={signupLink}>{signupLink}</a>
                        </p>
                    ) : null}
                </section>

                <section className="stack">
                    <h2 style={{ margin: 0 }}>Verify Signup Link</h2>
                    <p className="muted tiny">Paste token and set your password.</p>
                    <form className="auth-form" onSubmit={onSignupVerify}>
                        <label>
                            Email
                            <input
                                autoComplete="email"
                                type="email"
                                required
                                value={signupVerifyEmail}
                                onChange={(event) => setSignupVerifyEmail(event.target.value)}
                                placeholder="participant@example.com"
                            />
                        </label>
                        <label>
                            Token
                            <input
                                type="text"
                                required
                                value={signupToken}
                                onChange={(event) => setSignupToken(event.target.value)}
                                placeholder="Paste signup token"
                            />
                        </label>
                        <label>
                            New Password
                            <input
                                type="password"
                                autoComplete="new-password"
                                required
                                minLength={8}
                                value={signupPassword}
                                onChange={(event) => setSignupPassword(event.target.value)}
                                placeholder="At least 8 characters"
                            />
                        </label>
                        <label>
                            Confirm Password
                            <input
                                type="password"
                                autoComplete="new-password"
                                required
                                minLength={8}
                                value={signupConfirmPassword}
                                onChange={(event) => setSignupConfirmPassword(event.target.value)}
                                placeholder="Confirm password"
                            />
                        </label>
                        <button type="submit" disabled={isSignupVerifySubmitting}>
                            {isSignupVerifySubmitting ? 'Verifying...' : 'Verify And Set Password'}
                        </button>
                    </form>
                </section>

                {signupMessage ? <p className="status">{signupMessage}</p> : null}
            </section>
        </div>
    )
}
