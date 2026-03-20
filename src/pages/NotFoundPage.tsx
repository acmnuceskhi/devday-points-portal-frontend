import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="center-state stacked">
      <h2>Page not found</h2>
      <p className="muted">The route you requested does not exist in the participant portal.</p>
      <Link className="link-button" to="/">
        Go to Dashboard
      </Link>
    </div>
  )
}
