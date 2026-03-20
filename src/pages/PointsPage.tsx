import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import type { ActivityProgressItem, PointsLeaderboardItem, PointsSummary } from '../types/api'

export function PointsPage() {
  const { accessToken } = useAuth()
  const [summary, setSummary] = useState<PointsSummary | null>(null)
  const [activities, setActivities] = useState<ActivityProgressItem[]>([])
  const [leaderboard, setLeaderboard] = useState<PointsLeaderboardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function load() {
      if (!accessToken) {
        setErrorMessage('Session expired. Please login again.')
        setLoading(false)
        return
      }

      try {
        setErrorMessage('')
        const [summaryData, activitiesData, leaderboardData] = await Promise.all([
          api.getMyPointsSummary(accessToken),
          api.getMyActivityProgress(accessToken),
          api.getPointsLeaderboard(100, 0),
        ])

        setSummary(summaryData)
        setActivities(activitiesData)
        setLeaderboard(leaderboardData.items)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Could not load points data')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [accessToken])

  const completedCount = useMemo(
    () => activities.filter((item) => item.isCompleted).length,
    [activities],
  )
  const availablePoints = useMemo(
    () => activities.filter((item) => item.isActive).reduce((acc, item) => acc + item.points, 0),
    [activities],
  )

  if (loading) {
    return <div className="center-state">Loading points...</div>
  }

  if (errorMessage) {
    return <div className="error-banner">{errorMessage}</div>
  }

  return (
    <section className="stack">
      <h2>Points Center</h2>

      <div className="grid two">
        <article className="card">
          <h3>Total Points</h3>
          <p style={{ fontSize: 34, fontWeight: 700 }}>{summary?.totalPoints ?? 0}</p>
          <p className="muted tiny">
            Last updated:{' '}
            {summary?.updatedAt ? new Date(summary.updatedAt).toLocaleString() : 'No points yet'}
          </p>
        </article>

        <article className="card">
          <h3>Activity Progress</h3>
          <p className="muted">
            Completed {completedCount} of {activities.length} activities
          </p>
          <p className="muted">Available active points: {availablePoints}</p>
        </article>
      </div>

      <article className="card table-wrap">
        <h3>Your Activities</h3>
        <table>
          <thead>
            <tr>
              <th>Activity</th>
              <th>Points</th>
              <th>Status</th>
              <th>Completed At</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.name}</strong>
                  {item.description ? <p className="muted tiny">{item.description}</p> : null}
                </td>
                <td>{item.points}</td>
                <td>{item.isCompleted ? 'Completed' : item.isActive ? 'Pending' : 'Inactive'}</td>
                <td>{item.completedAt ? new Date(item.completedAt).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      <article className="card table-wrap">
        <h3>Points Leaderboard</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Institution</th>
              <th>Total Points</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((item, index) => (
              <tr key={item.participantId}>
                <td>{index + 1}</td>
                <td>{item.fullName}</td>
                <td>{item.institution || '-'}</td>
                <td>{item.totalPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </section>
  )
}
