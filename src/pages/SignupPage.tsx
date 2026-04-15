import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiRequestError, api } from '../lib/api'

export function SignupPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [signupLink, setSignupLink] = useState('')
  const [hint, setHint] = useState('')
  const [registeredLoginPath, setRegisteredLoginPath] = useState('')

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')
    setSignupLink('')
    setHint('')
    setRegisteredLoginPath('')

    try {
      const result = await api.signupRequest(email.trim(), fullName.trim())
      setMessage(result.message)
      setHint(result.hint || '')
      if (result.signupLink) {
        setSignupLink(result.signupLink)
      }
      navigate(`/signup/verify?email=${encodeURIComponent(email.trim())}`)
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === 'PARTICIPANT_ALREADY_REGISTERED') {
        const details = (error.details as { loginPath?: string } | null) || null
        const loginPath = details?.loginPath || '/login'
        const connector = loginPath.includes('?') ? '&' : '?'
        setRegisteredLoginPath(`${loginPath}${connector}email=${encodeURIComponent(email.trim())}`)
      }
      setMessage(error instanceof Error ? error.message : 'Could not request signup link')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-card">
        <div className="auth-headline">
          <p className="eyebrow">Devday 2026 | Account Registration</p>
          <h1 className="auth-title">Create Participant Account</h1>
          <p className="auth-subtitle">
            Request a secure verification link to create your participant account.
          </p>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            Full Name
            <input
              autoComplete="name"
              type="text"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Enter your full name"
            />
          </label>

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

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending Verification Link...' : 'Send Verification Link'}
          </button>
        </form>

        {message ? <p className="status">{message}</p> : null}
        {hint ? <p className="muted tiny">{hint}</p> : null}
        {registeredLoginPath ? (
          <p className="tiny">
            Existing participant detected. Continue to <Link to={registeredLoginPath}>login</Link> with this email.
          </p>
        ) : null}
        {signupLink ? (
          <p className="tiny">
            Dev token link: <a href={signupLink}>{signupLink}</a>
          </p>
        ) : null}

        <p className="auth-status">Use your competition-registered email so your activity progress and points remain unified.</p>

        <p className="muted tiny">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </section>
    </div>
  )
}
