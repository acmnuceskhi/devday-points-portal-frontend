import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { PointsLeaderboardItem } from '../types/api'

export function RankingsPage() {
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

    return (
        <section className="stack">
            <h2>Rankings</h2>

            {loading ? <div className="center-state">Loading rankings...</div> : null}
            {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

            {!loading && !errorMessage ? (
                <div className="card table-wrap table-scroll-y">
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
            ) : null}
        </section>
    )
}
