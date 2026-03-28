import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

export function SignupPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [signupLink, setSignupLink] = useState('')
  const [hint, setHint] = useState('')

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')
    setSignupLink('')
    setHint('')

    try {
      const result = await api.signupRequest(email.trim(), fullName.trim())
      setMessage(result.message)
      setHint(result.hint || '')
      if (result.signupLink) {
        setSignupLink(result.signupLink)
      }
      navigate(`/signup/verify?email=${encodeURIComponent(email.trim())}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not request signup link')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Devday 2026</p>
        <h1>Create Participant Access</h1>
        <p className="muted">
          Use this if you want to participate in activities and you were not previously registered through competition signup.
        </p>
        <p className="muted tiny">
          If you already registered for any competition, use that same email here so all your points and activity scores stay in one place.
        </p>

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
            {isSubmitting ? 'Requesting OTP...' : 'Request OTP Link'}
          </button>
        </form>

        {message ? <p className="status">{message}</p> : null}
        {hint ? <p className="muted tiny">{hint}</p> : null}
        {signupLink ? (
          <p className="tiny">
            Dev link: <a href={signupLink}>{signupLink}</a>
          </p>
        ) : null}

        <p className="muted tiny">
          Already have access? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </div>
  )
}
