import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { formatCompetitionSchedule } from '../lib/formatCompetitionSchedule'
import type { ParticipantCompetition, TeamDetail } from '../types/api'
import { TeamDetailModal } from '../components/TeamDetailModal'
import { TechLoader } from '../components/TechLoader'

export function MyCompetitionsPage() {
  const { accessToken } = useAuth()
  const [items, setItems] = useState<ParticipantCompetition[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<TeamDetail | null>(null)
  const [selectedTeamLoading, setSelectedTeamLoading] = useState(false)
  const [selectedTeamError, setSelectedTeamError] = useState('')

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

  const onOpenTeam = async (teamId: string) => {
    if (!accessToken) return

    setSelectedTeam(null)
    setSelectedTeamError('')
    setSelectedTeamLoading(true)

    try {
      const data = await api.getTeamDetail(teamId, accessToken)
      setSelectedTeam(data)
    } catch (error) {
      setSelectedTeamError(error instanceof Error ? error.message : 'Could not load team details')
    } finally {
      setSelectedTeamLoading(false)
    }
  }

  const closeTeamModal = () => {
    setSelectedTeam(null)
    setSelectedTeamError('')
    setSelectedTeamLoading(false)
  }

  if (loading) {
    return <TechLoader label="Loading main missions..." />
  }

  if (errorMessage) {
    return <div className="error-banner">{errorMessage}</div>
  }

  if (items.length === 0) {
    return <div className="center-state">You are not assigned to any teams yet.</div>
  }

  return (
    <section className="dashboard-shell stack">
      <header className="section-head mission-queue-head">
        <div className="panel-header">
          <h2 className="page-heading">Main Missions</h2>
          <p className="muted tiny">Live schedule from the simulation runtime.</p>
        </div>
        <div className="actions-row">
          <a className="link-button" href="https://devday26.com/modules" target="_blank" rel="noreferrer">
            Open Competition Modules <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>

      <div className="dashboard-export-frame stack" id="my-competitions-export">
        <section className="dashboard-panel">
          <div className="stream-list">
        {items.map((item) => (
          <article key={`${item.teamId}-${item.competitionId}`} className="stream-row">
            <div>
              <p className="stream-title">{item.competitionName}</p>
              <p className="stream-subline">
                {formatCompetitionSchedule(item)}
              </p>
            </div>
            <p className="mission-team">
              {item.teamName} {item.isLeader ? '(Leader)' : ''}
            </p>
            <p className="mission-venue">
              {item.venues?.length
                ? item.venues.map((venue) => venue.name).join(', ')
                : item.venueName || 'TBA'}
            </p>
            <span className={`competition-status-pill ${item.paymentStatus === 'Paid' ? 'is-verified' : ''}`}>
              {item.paymentStatus}
            </span>
            <button type="button" className="outline-button team-details-button" onClick={() => void onOpenTeam(item.teamId)}>
              Team Details
            </button>
          </article>
        ))}
          </div>
        </section>
      </div>

      {(selectedTeamLoading || selectedTeam || selectedTeamError) ? (
        <TeamDetailModal
          item={selectedTeam}
          loading={selectedTeamLoading}
          errorMessage={selectedTeamError}
          onClose={closeTeamModal}
        />
      ) : null}
    </section>
  )
}
