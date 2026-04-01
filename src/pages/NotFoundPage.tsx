import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="center-state stacked card sim-panel" style={{ maxWidth: 580, margin: '40px auto', minHeight: 280 }}>
      <p className="eyebrow">Simulation Routing Alert</p>
      <h2>404 | Signal Lost</h2>
      <p className="muted">This navigation node does not exist in the participant simulation grid.</p>
      <Link className="link-button" to="/">
        Return to Console
      </Link>
    </div>
  )
}
