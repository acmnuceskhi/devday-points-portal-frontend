import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

export function SignupVerifyPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [token, setToken] = useState(searchParams.get('token') || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    try {
      const result = await api.signupVerify(email.trim(), token.trim(), password, confirmPassword)
      setMessage(result.message)
      await login(email.trim(), password)
      navigate('/', { replace: true })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not verify OTP link')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-card">
        <div className="auth-headline">
          <p className="eyebrow">Devday 2026 | OTP Verification</p>
          <h1 className="auth-title">Complete Operator Handshake</h1>
          <p className="auth-subtitle">Validate your OTP token and lock in your console credentials.</p>
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
            OTP Token
            <input
              type="text"
              required
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Paste OTP token"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
            />
          </label>

          <label>
            Confirm Password
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm password"
            />
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying Handshake...' : 'Verify and Enter Console'}
          </button>
        </form>

        {message ? <p className="status">{message}</p> : null}

        <p className="muted tiny">
          OTP expired? <Link to="/signup">Request new access link</Link>
        </p>
      </section>
    </div>
  )
}
