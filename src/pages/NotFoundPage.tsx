import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="center-state stacked card sim-panel" style={{ maxWidth: 580, margin: '40px auto', minHeight: 280 }}>
      <p className="eyebrow">Navigation Notice</p>
      <h2>404 | Page Not Found</h2>
      <p className="muted">This page does not exist in the participant portal.</p>
      <Link className="link-button" to="/">
        Return to Dashboard
      </Link>
    </div>
  )
}
