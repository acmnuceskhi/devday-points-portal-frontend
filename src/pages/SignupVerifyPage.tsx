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
  const token = (searchParams.get('token') || '').trim()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!token) {
      setMessage('Verification token is missing. Open the latest signup link from your email.')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      const result = await api.signupVerify(email.trim(), token, password, confirmPassword)
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
    <div className="auth-page px-5 md:px-0">
      <section className="mx-auto w-full max-w-xl space-y-6 rounded-xl border border-[#2f2f3a] bg-[#0e0e14]/90 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.35)] md:p-7">
        <div className="space-y-2 border-b border-[#2a2a34] pb-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#b8b8c2]">Devday 2026 | Account Verification</p>
          <h1 className="text-2xl font-bold leading-tight text-white md:text-3xl">Complete Email Verification</h1>
          <p className="text-sm text-[#a9a9b4]">Use the verification link from your email to complete account setup.</p>
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
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              className="w-full rounded-md border border-[#383844] bg-transparent px-4 py-3 text-sm text-white placeholder:text-[#8f8f9a] focus:border-[#ff2a2f] focus:outline-none"
            />
          </label>

          <label className="grid gap-2 text-sm text-[#c9c9d3]">
            <span>Confirm Password</span>
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm password"
              className="w-full rounded-md border border-[#383844] bg-transparent px-4 py-3 text-sm text-white placeholder:text-[#8f8f9a] focus:border-[#ff2a2f] focus:outline-none"
            />
          </label>

          <button type="submit" disabled={isSubmitting || !token} className="w-full rounded-md bg-[#ff2a2f] px-4 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-[#ea1e24] disabled:cursor-not-allowed disabled:opacity-70">
            {isSubmitting ? 'Verifying...' : 'Verify and Continue'}
          </button>
        </form>

        {!token ? (
          <p className="status">Open the signup verification link from your email to continue.</p>
        ) : null}

        {message ? <p className="status">{message}</p> : null}

        <p className="text-xs text-[#a9a9b4]">
          Verification link expired? <Link to="/signup" className="text-[#ff7d80] hover:text-[#ff2a2f]">Request a new link</Link>
        </p>
      </section>
    </div>
  )
}
