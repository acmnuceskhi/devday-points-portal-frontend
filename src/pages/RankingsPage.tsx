import { useEffect, useState } from 'react'
import { api } from '../lib/api.legacy'
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
        <section className="dashboard-shell stack px-5 md:px-0">
            <section className="space-y-2 border-b border-[#2a2a34] pb-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#b8b8c2]">Rankings</p>
                <h2 className="text-2xl  leading-tight text-white md:text-3xl">Points Leaderboard</h2>
                {/* <p className="text-sm text-[#a9a9b4]">See how participants rank by total points across the event.</p> */}
            </section>

            {loading ? <TechLoader label="Loading leaderboard..." /> : null}
            {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

            {!loading && !errorMessage ? (
                <>
                    <section className="grid grid-cols-[1.4fr_1fr] gap-3 border-b border-[#2f2f38] pb-4" aria-label="Participant ranking summary">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.14em] text-[#b8b8c2]">Your Rank</p>
                            <strong className="mt-1 block text-[2.1rem] leading-none text-[#ff2a2f] md:text-[2.5rem]">{yourRank ? `#${yourRank}` : '--'}</strong>
                            {/* <p className="mt-1 text-xs text-[#a9a9b4]">Current position in the top 100 leaderboard.</p> */}
                        </div>

                        <div className="text-right">
                            <p className="text-[11px] uppercase tracking-[0.14em] text-[#b8b8c2]">Your Points</p>
                            <strong className="mt-1 block text-[1.5rem] leading-none text-white md:text-[1.8rem]">{yourEntry ? yourEntry.totalPoints : '--'}</strong>
                            {/* <p className="mt-1 text-xs text-[#a9a9b4]">Total points counted for ranking.</p> */}
                        </div>
                    </section>

                    {!yourRank ? (
                        <p className="muted tiny leaderboard-note">
                            Your rank will appear here once your participant profile is in the top 100 list.
                        </p>
                    ) : null}

                    <div className="dashboard-panel table-wrap table-scroll-y sim-panel leaderboard-table">
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
