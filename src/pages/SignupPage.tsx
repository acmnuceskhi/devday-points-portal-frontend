import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

export function SignupPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [signupLink, setSignupLink] = useState('')

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')
    setSignupLink('')

    try {
      const result = await api.signupRequest(email.trim())
      setMessage(result.message)
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

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Requesting OTP...' : 'Request OTP Link'}
          </button>
        </form>

        {message ? <p className="status">{message}</p> : null}
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
