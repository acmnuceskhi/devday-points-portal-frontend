import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import type { ParticipantCompetition } from '../types/api'

export function MyCompetitionsPage() {
  const { accessToken } = useAuth()
  const [items, setItems] = useState<ParticipantCompetition[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function load() {
      if (!accessToken) {
        setLoading(false)
        return
      }

      try {
        setErrorMessage('')
        const data = await api.getMyCompetitions(accessToken)
        setItems(data)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Could not load competitions')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [accessToken])

  if (loading) {
    return <div className="center-state">Loading your competitions...</div>
  }

  if (errorMessage) {
    return <div className="error-banner">{errorMessage}</div>
  }

  if (items.length === 0) {
    return <div className="center-state">You are not assigned to any teams yet.</div>
  }

  return (
    <section className="stack">
      <h2>My Competitions</h2>
      <div className="grid">
        {items.map((item) => (
          <article key={`${item.teamId}-${item.competitionId}`} className="card">
            <h3>{item.competitionName}</h3>
            <p className="muted">
              Team: <strong>{item.teamName}</strong> {item.isLeader ? '(Leader)' : ''}
            </p>
            <p className="muted">
              Date: {new Date(item.compDay).toLocaleDateString()} | Time: {item.startTime || '-'} -{' '}
              {item.endTime || '-'}
            </p>
            <p className="muted">Venue: {item.venueName || 'TBA'}</p>
            <p className="status">Payment: {item.paymentStatus}</p>
            <div className="actions-row">
              <Link className="link-button" to={`/teams/${item.teamId}`}>
                View Team
              </Link>
              <Link className="link-button" to={`/competitions/${item.competitionId}`}>
                View Competition
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
