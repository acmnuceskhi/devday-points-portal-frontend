import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { PointsLeaderboardItem } from '../types/api'
import { TechLoader } from '../components/TechLoader'

export function RankingsPage() {
    const { participant } = useAuth()
    const [items, setItems] = useState<PointsLeaderboardItem[]>([])
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        async function load() {
            try {
                setErrorMessage('')
                const data = await api.getPointsLeaderboard(100, 0)
                setItems(data.items)
            } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : 'Could not load rankings')
            } finally {
                setLoading(false)
            }
        }

        void load()
    }, [])

    const yourRank = participant
        ? items.findIndex((item) => item.participantId === participant.id) + 1
        : 0

    return (
        <section className="dashboard-shell stack">
            <header className="panel-header">
                <h2 className="page-heading">Global Simulation Leaderboard</h2>
                <p className="muted tiny">Top participants ranked by total points.</p>
            </header>

            {loading ? <TechLoader label="Syncing leaderboard feed..." /> : null}
            {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

            {!loading && !errorMessage ? (
                <>
                {yourRank ? (
                    <section className="dashboard-metrics-strip" aria-label="Your ranking">
                        <article className="metric-block">
                            <p>Your Signal Position</p>
                            <strong>#{yourRank}</strong>
                        </article>
                    </section>
                ) : null}
                <div className="dashboard-panel table-wrap table-scroll-y sim-panel">
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
                            {items.map((item, index) => (
                                <tr key={item.participantId}>
                                    <td>{index + 1}</td>
                                    <td>{item.fullName}</td>
                                    <td>{item.institution || '-'}</td>
                                    <td>{item.totalPoints}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                </>
            ) : null}
        </section>
    )
}
