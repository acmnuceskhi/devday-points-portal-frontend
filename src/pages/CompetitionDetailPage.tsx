import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { CompetitionDetail } from '../types/api'

export function CompetitionDetailPage() {
  const { competitionId } = useParams()
  const [item, setItem] = useState<CompetitionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function load() {
      if (!competitionId) {
        setErrorMessage('Missing competition id')
        setLoading(false)
        return
      }

      try {
        setErrorMessage('')
        const data = await api.getCompetitionDetail(competitionId)
        setItem(data)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Could not load competition')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [competitionId])

  if (loading) {
    return <div className="center-state">Loading competition details...</div>
  }

  if (errorMessage) {
    return <div className="error-banner">{errorMessage}</div>
  }

  if (!item) {
    return <div className="center-state">Competition not found.</div>
  }

  return (
    <section className="stack">
      <div className="section-head">
        <h2>{item.name}</h2>
        <Link className="link-button" to="/competitions">
          Return to Mission Grid
        </Link>
      </div>

      <article className="card sim-panel">
        <p>{item.description || 'No description provided.'}</p>
        <dl className="data-list compact">
          <div>
            <dt>Date</dt>
            <dd>{new Date(item.compDay).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>
              {item.startTime || '-'} to {item.endTime || '-'}
            </dd>
          </div>
          <div>
            <dt>Registration Deadline</dt>
            <dd>{item.registrationDeadline ? new Date(item.registrationDeadline).toLocaleDateString() : '-'}</dd>
          </div>
          <div>
            <dt>Available Seats</dt>
            <dd>{item.availableSeats}</dd>
          </div>
        </dl>
      </article>

      <h3>Runtime Venues</h3>
      <div className="grid">
        {item.venues.length ? (
          item.venues.map((venue) => (
            <article className="card" key={venue.id}>
              <h4>{venue.name}</h4>
              <p className="muted">Location: {venue.location || '-'}</p>
              <p className="muted">Capacity: {venue.capacity || '-'}</p>
              <p className="muted">Facilities: {venue.facilities || '-'}</p>
            </article>
          ))
        ) : (
          <div className="center-state">No venues assigned yet.</div>
        )}
      </div>
    </section>
  )
}
