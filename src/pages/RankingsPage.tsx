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
    const yourEntry = participant ? items.find((item) => item.participantId === participant.id) || null : null

    const getRankNumberClass = (rank: number) => {
        if (rank === 1) return 'rank-number top-1'
        if (rank === 2) return 'rank-number top-2'
        if (rank === 3) return 'rank-number top-3'
        return 'rank-number'
    }

    return (
        <section className="dashboard-shell stack">

            <header className="panel-header">
                <h1 className="page-heading text-4xl my-5 md:hidden">Leaderboard</h1>
                <h1 className="page-heading text-4xl my-5 hidden md:block">Points Leaderboard</h1>
            </header>

            {loading ? <TechLoader label="Loading leaderboard..." /> : null}
            {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

            {!loading && !errorMessage ? (
                <>
                    <section className="leaderboard-inline-rank mx-[5%] md:w-[60%] md:mx-[20%]" aria-label="Participant ranking summary">
                        <div>
                            <p className="leaderboard-inline-label">Your Rank</p>
                            <strong className="md:text-3xl text-red-500">{yourRank ? `#${yourRank}` : '--'}</strong>
                        </div>
                        <div className="leaderboard-inline-right">
                            <p className="leaderboard-inline-label">Your Points</p>
                            <strong className="md:text-3xl">{yourEntry ? yourEntry.totalPoints : '--'}</strong>
                        </div>
                    </section>

                    {!yourRank ? (
                        <p className="muted tiny leaderboard-note">
                            Your rank will appear here once your participant profile is in the top 100 list.
                        </p>
                    ) : null}

                    <div className="dashboard-panel md:w-[60%] md:mx-[20%] table-wrap table-scroll-y sim-panel leaderboard-table">
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
                                {items.map((item, index) => {
                                    const rank = index + 1
                                    const isCurrentParticipant = participant ? item.participantId === participant.id : false

                                    return (
                                        <tr key={item.participantId} className={isCurrentParticipant ? 'current-user-row' : ''}>
                                            <td>
                                                <span className={getRankNumberClass(rank)}>{rank}</span>
                                            </td>
                                            <td>{item.fullName}</td>
                                            <td>{item.institution || '-'}</td>
                                            <td>{item.totalPoints}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : null}
        </section>
    )
}
