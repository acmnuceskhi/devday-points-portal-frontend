import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import type { ParticipantCompetition } from '../types/api'

export function DashboardPage() {
  const { participant, accessToken } = useAuth()
  const [competitions, setCompetitions] = useState<ParticipantCompetition[]>([])
  const [loadingCompetitions, setLoadingCompetitions] = useState(true)
  const [competitionsError, setCompetitionsError] = useState('')

  useEffect(() => {
    async function loadCompetitions() {
      if (!accessToken) {
        setLoadingCompetitions(false)
        return
      }

      try {
        setCompetitionsError('')
        const rows = await api.getMyCompetitions(accessToken)
        setCompetitions(rows)
      } catch (error) {
        setCompetitionsError(error instanceof Error ? error.message : 'Could not load your competitions')
      } finally {
        setLoadingCompetitions(false)
      }
    }

    void loadCompetitions()
  }, [accessToken])

  return (
    <section className="stack">
      <h2>Dashboard</h2>
      <div className="grid two">
        <article className="card">
          <h3>Identity</h3>
          <dl className="data-list">
            <div>
              <dt>Name</dt>
              <dd>{participant?.fullName || '-'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{participant?.email || '-'}</dd>
            </div>
            <div>
              <dt>CNIC</dt>
              <dd>{participant?.cnic || '-'}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{participant?.phone || '-'}</dd>
            </div>
          </dl>
        </article>

        <article className="card">
          <h3>Academic Info</h3>
          <dl className="data-list">
            <div>
              <dt>Institution</dt>
              <dd>{participant?.institution || '-'}</dd>
            </div>
            <div>
              <dt>Roll Number</dt>
              <dd>{participant?.rollNumber || '-'}</dd>
            </div>
            <div>
              <dt>Participant ID</dt>
              <dd>{participant?.id || '-'}</dd>
            </div>
            <div>
              <dt>Joined</dt>
              <dd>{participant?.createdAt ? new Date(participant.createdAt).toLocaleString() : '-'}</dd>
            </div>
          </dl>
        </article>
      </div>

      <article className="card stack">
        <h3>Registered Competitions</h3>
        {loadingCompetitions ? <p className="muted">Loading your competitions...</p> : null}
        {competitionsError ? <div className="error-banner">{competitionsError}</div> : null}
        {!loadingCompetitions && !competitionsError ? (
          <div className="competition-cards-grid">
            {competitions.map((item) => (
              <article key={`${item.teamId}-${item.competitionId}`} className="competition-card-modern">
                <div className="competition-card-head">
                  <h4>{item.competitionName}</h4>
                  <span className="competition-status-pill">{item.paymentStatus}</span>
                </div>

                <div className="competition-card-teamline">
                  <strong>{item.teamName}</strong>
                  {item.isLeader ? <span className="competition-role-pill">Team Leader</span> : null}
                </div>

                <dl className="competition-meta-list">
                  <div>
                    <dt>Date</dt>
                    <dd>{new Date(item.compDay).toLocaleDateString()}</dd>
                  </div>
                  <div>
                    <dt>Time</dt>
                    <dd>
                      {item.startTime || '-'} - {item.endTime || '-'}
                    </dd>
                  </div>
                  <div>
                    <dt>Venue</dt>
                    <dd>{item.venueName || 'TBA'}</dd>
                  </div>
                </dl>

                <div className="competition-card-actions">
                  <Link className="link-button" to={`/teams/${item.teamId}`}>
                    View Team
                  </Link>
                </div>
              </article>
            ))}
            {!competitions.length ? <p className="muted">You are not assigned to any teams yet.</p> : null}
          </div>
        ) : null}
      </article>
    </section>
  )
}
