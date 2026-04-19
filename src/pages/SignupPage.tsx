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
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState('')
  const [showSignupConfirmDialog, setShowSignupConfirmDialog] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')
    setSignupLink('')
    setHint('')
    setRegisteredLoginPath('')
    setPendingVerifyEmail('')
    setShowSignupConfirmDialog(false)

    try {
      const normalizedEmail = email.trim()
      const result = await api.signupRequest(normalizedEmail, fullName.trim())
      setMessage(`Verification email sent to ${normalizedEmail} if such an email exists.`)
      setHint(result.hint || '')
      if (result.signupLink) {
        setSignupLink(result.signupLink)
      }
      setPendingVerifyEmail(normalizedEmail)
      setShowSignupConfirmDialog(true)
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

  const continueToVerify = () => {
    if (!pendingVerifyEmail) return
    navigate(`/signup/verify?email=${encodeURIComponent(pendingVerifyEmail)}`)
  }

  const goBackFromDialog = () => {
    setShowSignupConfirmDialog(false)
  }

  return (
    <div className="auth-page px-5 md:px-0">
      <section className="mx-auto w-full max-w-xl space-y-6 rounded-xl border border-[#2f2f3a] bg-[#0e0e14]/90 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.35)] md:p-7">
        <div className="space-y-2 border-b border-[#2a2a34] pb-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#b8b8c2]">Devday 2026 | Account Registration</p>
          <h1 className="text-2xl  leading-tight text-white md:text-3xl">Create Participant Account</h1>
          <p className="text-sm text-[#a9a9b4]">
            Request a secure verification link to create your participant account.
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="grid gap-2 text-sm text-[#c9c9d3]">
            <span>Full Name</span>
            <input
              autoComplete="name"
              type="text"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Enter your full name"
              className="w-full rounded-md border border-[#383844] bg-transparent px-4 py-3 text-sm text-white placeholder:text-[#8f8f9a] focus:border-[#ff2a2f] focus:outline-none"
            />
          </label>

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

          <button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-[#ff2a2f] px-4 py-3 text-sm  uppercase tracking-widest text-white transition hover:bg-[#ea1e24] disabled:cursor-not-allowed disabled:opacity-70">
            {isSubmitting ? 'Sending Verification Link...' : 'Send Verification Link'}
          </button>
        </form>

        {message ? <p className="status">{message}</p> : null}
        {hint ? <p className="text-xs text-[#a9a9b4]">{hint}</p> : null}
        {registeredLoginPath ? (
          <p className="text-xs text-[#a9a9b4]">
            Existing participant detected. Continue to <Link to={registeredLoginPath} className="text-[#ff7d80] hover:text-[#ff2a2f]">login</Link> with this email.
          </p>
        ) : null}
        {signupLink ? (
          <p className="text-xs text-[#a9a9b4] break-all">
            Dev token link: <a href={signupLink} className="text-[#ff7d80] hover:text-[#ff2a2f]">{signupLink}</a>
          </p>
        ) : null}

        <p className="text-sm text-[#b7b7c2]">Use your competition-registered email so your activity progress and points remain unified.</p>

        <p className="text-xs text-[#a9a9b4]">
          Already registered? <Link to="/login" className="text-[#ff7d80] hover:text-[#ff2a2f]">Login</Link>
        </p>
      </section>

      {showSignupConfirmDialog ? (
        <div className="admin-dialog-backdrop" role="presentation">
          <div className="admin-dialog" role="dialog" aria-modal="true" aria-live="polite">
            <h3>Verification Email Sent</h3>
            <p className="muted">
              Verification email sent to {pendingVerifyEmail} if such an email exists.
            </p>
            <p className="muted tiny">
              If you already registered in competitions, login using the same email to keep your points and activity history unified.
            </p>
            <div className="actions-row">
              <button type="button" onClick={continueToVerify}>OK, continue</button>
              <button type="button" className="outline-button" onClick={goBackFromDialog}>No, go back</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
