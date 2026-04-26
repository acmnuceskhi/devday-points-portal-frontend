import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api.legacy'
import type { ActivityProgressItem, PointsSummary } from '../types/api'
import { TechLoader } from '../components/TechLoader'
import { LinkifiedText } from '../components/LinkifiedText'

type SubmissionDialogState = {
    isOpen: boolean
    status: 'loading' | 'success' | 'error'
    title: string
    detail: string
}

export function PointsPage() {
    const { accessToken } = useAuth()
    const [summary, setSummary] = useState<PointsSummary | null>(null)
    const [activities, setActivities] = useState<ActivityProgressItem[]>([])
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')
    const [submissionLinks, setSubmissionLinks] = useState<Record<string, string>>({})
    const [submissionTexts, setSubmissionTexts] = useState<Record<string, string>>({})
    const [activitySearch, setActivitySearch] = useState('')
    const [activeObjectiveTab, setActiveObjectiveTab] = useState<'main' | 'side'>('side')
    const [showCompletedMainOnly, setShowCompletedMainOnly] = useState(true)
    const [submittingActivityId, setSubmittingActivityId] = useState<string | null>(null)
    const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)
    const [submissionDialog, setSubmissionDialog] = useState<SubmissionDialogState>({
        isOpen: false,
        status: 'loading',
        title: '',
        detail: '',
    })

    useEffect(() => {
        async function load() {
            if (!accessToken) {
                setErrorMessage('Session expired. Please login again.')
                setLoading(false)
                return
            }

            try {
                setErrorMessage('')
                const [summaryData, activitiesData] = await Promise.all([
                    api.getMyPointsSummary(accessToken),
                    api.getMyActivityProgress(accessToken),
                ])

                setSummary(summaryData)
                setActivities(activitiesData)
            } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : 'Could not load points data')
            } finally {
                setLoading(false)
            }
        }

        void load()
    }, [accessToken])

    const sideMissionCompletedCount = useMemo(
        () => activities.filter((item) => !item.code.endsWith('_PARTICIPATION') && item.isCompleted).length,
        [activities],
    )

    const selectedActivity = useMemo(
        () => activities.find((item) => item.id === selectedActivityId) || null,
        [activities, selectedActivityId],
    )

    const filteredActivities = useMemo(() => {
        const needle = activitySearch.trim().toLowerCase()
        if (!needle) return activities

        return activities.filter((item) => {
            return (
                item.name.toLowerCase().includes(needle) ||
                item.code.toLowerCase().includes(needle) ||
                item.activityTypeCode.toLowerCase().includes(needle) ||
                (item.description || '').toLowerCase().includes(needle)
            )
        })
    }, [activities, activitySearch])

    const mainObjectives = useMemo(
        () => filteredActivities.filter((item) => item.code.endsWith('_PARTICIPATION')),
        [filteredActivities],
    )

    const sideObjectives = useMemo(
        () => filteredActivities.filter((item) => !item.code.endsWith('_PARTICIPATION')),
        [filteredActivities],
    )

    const displayedMainObjectives = useMemo(
        () => (showCompletedMainOnly ? mainObjectives.filter((item) => item.isCompleted) : mainObjectives),
        [mainObjectives, showCompletedMainOnly],
    )

    const onSubmitActivity = async (event: FormEvent, item: ActivityProgressItem) => {
        event.preventDefault()
        if (!accessToken) return

        const isLinkBased = item.activityTypeCode === 'LINK_BASED'
        const isCorrectAnswer = item.activityTypeCode === 'CORRECT_ANSWER'
        const textInput = (submissionTexts[item.id] || '').trim()
        const linkInput = (submissionLinks[item.id] || '').trim()

        if (isLinkBased && !linkInput) return
        if (!isLinkBased && !textInput) return

        try {
            setSubmittingActivityId(item.id)
            setSubmissionDialog({
                isOpen: true,
                status: 'loading',
                title: isCorrectAnswer ? 'Checking Answer' : 'Submitting Activity',
                detail: isCorrectAnswer
                    ? 'Please wait while we validate your answer...'
                    : 'Please wait while we submit your activity for review...',
            })
            await api.submitMyActivity(accessToken, {
                activityId: item.id,
                submissionLink: isLinkBased ? linkInput : undefined,
                submissionText: !isLinkBased && !isCorrectAnswer ? textInput : undefined,
                answerText: isCorrectAnswer ? textInput : undefined,
            })
            const activitiesData = await api.getMyActivityProgress(accessToken)
            setActivities(activitiesData)
            setSubmissionLinks((prev) => ({ ...prev, [item.id]: '' }))
            setSubmissionTexts((prev) => ({ ...prev, [item.id]: '' }))
            setSubmissionDialog({
                isOpen: true,
                status: 'success',
                title: isCorrectAnswer ? 'Answer Submitted' : 'Submission Sent',
                detail: isCorrectAnswer
                    ? 'Your answer has been checked. Refresh status shown in the activity card.'
                    : 'Your submission was sent successfully and is now pending admin review.',
            })
        } catch (error) {
            setSubmissionDialog({
                isOpen: true,
                status: 'error',
                title: 'Submission Failed',
                detail: error instanceof Error ? error.message : 'Could not submit your link. Please try again.',
            })
        } finally {
            setSubmittingActivityId(null)
        }
    }

    const closeSubmissionDialog = () => {
        if (submissionDialog.status === 'loading') return
        setSubmissionDialog((prev) => ({ ...prev, isOpen: false }))
    }

    const openActivityDialog = (activityId: string) => {
        setSelectedActivityId(activityId)
    }

    const closeActivityDialog = () => {
        setSelectedActivityId(null)
    }

    if (loading) {
        return <TechLoader label="Loading points..." />
    }

    if (errorMessage) {
        return <div className="error-banner">{errorMessage}</div>
    }

    return (
        <section className="dashboard-shell stack px-5 md:px-0">
            <section className="space-y-2 border-b border-[#2a2a34] pb-4">
                {/* <p className="text-[11px] uppercase tracking-[0.16em] text-[#b8b8c2]">Progress Center</p> */}
                <h2 className="text-2xl leading-tight text-white md:text-3xl">Points and Activities</h2>
                {/* <p className="text-sm text-[#a9a9b4]">Track your competition participation and activity progress in one place.</p> */}
            </section>

            <section className="grid grid-cols-[1.4fr_1fr] gap-3 border-b border-[#2f2f38] pb-4" aria-label="Points metrics">
                <article>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#b8b8c2]">Total Points</p>
                    <strong className="mt-1 block text-[2.1rem] leading-none text-[#ff2a2f] md:text-[2.5rem]">{summary?.totalPoints ?? 0}</strong>
                    {/* <p className="mt-1 text-xs text-[#a9a9b4]">Overall score across all tracked activities.</p> */}
                </article>

                <article className="text-right">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#b8b8c2]">Activities Completed</p>
                    <strong className="mt-1 block text-[1.5rem] leading-none text-white md:text-[1.8rem]">{sideMissionCompletedCount}</strong>
                    {/* <p className="mt-1 text-xs text-[#a9a9b4]">Completed</p> */}
                </article>
            </section>

            <section className="stack pt-2">
                <div className="space-y-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="w-full md:max-w-2xl md:flex-1">
                            <input
                                value={activitySearch}
                                onChange={(event) => setActivitySearch(event.target.value)}
                                placeholder="Search competitions and activities"
                                className="w-full rounded-md border border-[#383844] bg-transparent px-4 py-3 text-sm text-white placeholder:text-[#8f8f9a] focus:border-[#ff2a2f] focus:outline-none"
                            />
                        </div>

                        <div className="grid w-full grid-cols-2 gap-2 rounded-lg border border-[#2f2f39] bg-[#0f0f13] p-1.5 md:w-105 md:shrink-0" role="tablist" aria-label="Activity categories">
                            <button
                                type="button"
                                className={`rounded-md px-3 py-2 text-xs  uppercase tracking-widest transition ${activeObjectiveTab === 'main'
                                    ? 'bg-[#ff2a2f] text-white shadow-lg shadow-[#ff2a2f]/25'
                                    : 'text-[#c5c5cf] bg-[#26262e] hover:text-white'
                                    }`}
                                role="tab"
                                aria-selected={activeObjectiveTab === 'main'}
                                onClick={() => setActiveObjectiveTab('main')}
                            >
                                Competitions ({mainObjectives.length})
                            </button>
                            <button
                                type="button"
                                className={`rounded-md px-3 py-2 text-xs  uppercase tracking-widest transition ${activeObjectiveTab === 'side'
                                    ? 'bg-[#ff2a2f] text-white shadow-lg shadow-[#ff2a2f]/25'
                                    : 'text-[#c5c5cf] bg-[#26262e] hover:text-white'
                                    }`}
                                role="tab"
                                aria-selected={activeObjectiveTab === 'side'}
                                onClick={() => setActiveObjectiveTab('side')}
                            >
                                Activities ({sideObjectives.length})
                            </button>
                        </div>
                    </div>

                    <p className="text-center text-xs text-[#a9a9b4] md:text-left">
                        {activeObjectiveTab === 'main'
                            ? 'Core competition participation checkpoints.'
                            : 'Optional and bonus activities.'}
                    </p>
                </div>

                <div className="stack">

                    {activeObjectiveTab === 'main' ? (
                        <label className="toggle-row">
                            <input
                                type="checkbox"
                                checked={showCompletedMainOnly}
                                onChange={(event) => setShowCompletedMainOnly(event.target.checked)}
                            />
                            Participated competitions only
                        </label>
                    ) : null}

                    {activeObjectiveTab === 'main' ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 auto-rows-fr">
                            {displayedMainObjectives.map((item) => {
                                const statusLabel = item.isCompleted
                                    ? 'Completed'
                                    : item.submissionStatus
                                        ? `Submitted (${item.submissionStatus})`
                                        : item.isActive
                                            ? 'Pending'
                                            : 'Inactive'

                                return (
                                    <article
                                        key={item.id}
                                        className="relative flex min-h-55 flex-col justify-between overflow-hidden rounded-lg border border-[#343441] bg-transparent p-4 transition hover:border-[#4a83a7]"
                                    >
                                        <div className="pr-3">
                                            <p className="stream-title">{item.name}</p>
                                            <p className="objective-meta">
                                                <LinkifiedText text={item.description || 'No description provided.'} />
                                            </p>
                                        </div>
                                        <div className="mt-4 flex items-end justify-between gap-3">
                                            <div className="space-y-1">
                                                <p className="objective-meta">Points: {item.points}</p>
                                                <span className={`competition-status-pill ${item.isCompleted ? 'is-verified' : ''}`}>
                                                    {statusLabel}
                                                </span>
                                            </div>
                                            <button type="button" className="outline-button" onClick={() => openActivityDialog(item.id)}>
                                                Details
                                            </button>
                                        </div>
                                        <span className="pointer-events-none absolute right-0 top-3 h-[calc(100%-1.5rem)] w-0.75 rounded-full bg-[#5ea9d6]" aria-hidden="true" />
                                    </article>
                                )
                            })}
                            {!displayedMainObjectives.length ? <p className="muted">No competitions.</p> : null}
                        </div>
                    ) : null}

                    {activeObjectiveTab === 'side' ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 auto-rows-fr">
                            {sideObjectives.map((item) => {
                                const statusLabel = item.isCompleted
                                    ? 'Completed'
                                    : item.submissionStatus
                                        ? `Submitted (${item.submissionStatus})`
                                        : item.isActive
                                            ? 'Pending'
                                            : 'Inactive'

                                return (
                                    <article
                                        key={item.id}
                                        className="relative flex min-h-55 flex-col justify-between overflow-hidden rounded-lg border border-[#343441] bg-transparent p-4 transition hover:border-[#4a9773]"
                                    >
                                        <div className="pr-3">
                                            <p className="stream-title">{item.name}</p>
                                            <p className="objective-meta">
                                                <LinkifiedText text={item.description || 'No description provided.'} />
                                            </p>
                                        </div>
                                        <div className="mt-4 flex items-end justify-between gap-3">
                                            <div className="space-y-1">
                                                <p className="objective-meta">Points: {item.points}</p>
                                                <span className={`competition-status-pill ${item.isCompleted ? 'is-verified' : ''}`}>
                                                    {statusLabel}
                                                </span>
                                            </div>
                                            <button type="button" className="outline-button" onClick={() => openActivityDialog(item.id)}>
                                                Details
                                            </button>
                                        </div>
                                        <span className="pointer-events-none absolute right-0 top-3 h-[calc(100%-1.5rem)] w-0.75 rounded-full bg-[#63c799]" aria-hidden="true" />
                                    </article>
                                )
                            })}
                            {!sideObjectives.length ? <p className="muted">No side activities match your search.</p> : null}
                        </div>
                    ) : null}
                </div>
            </section>

            {selectedActivity ? (
                <div className="admin-dialog-backdrop" role="presentation" onClick={closeActivityDialog}>
                    <div className="admin-dialog" role="dialog" aria-live="polite" onClick={(event) => event.stopPropagation()}>
                        <h3 className="font-bold text-white">{selectedActivity.name}</h3>
                        <p className="muted tiny">
                            <LinkifiedText text={selectedActivity.description || 'No description'} />
                        </p>
                        <div className="data-list compact">
                            <div>
                                <dt>Points</dt>
                                <dd>{selectedActivity.points}</dd>
                            </div>
                            <div>
                                <dt>Status</dt>
                                <dd>{selectedActivity.submissionStatus || (selectedActivity.isCompleted ? 'COMPLETED' : 'PENDING')}</dd>
                            </div>
                            <div>
                                <dt>Completed At</dt>
                                <dd>{selectedActivity.completedAt ? new Date(selectedActivity.completedAt).toLocaleString() : '-'}</dd>
                            </div>
                        </div>

                        {selectedActivity.activityTypeCode === 'LINK_BASED' ? (
                            <form className="actions-row" onSubmit={(event) => onSubmitActivity(event, selectedActivity)}>
                                <input
                                    type="url"
                                    value={submissionLinks[selectedActivity.id] || ''}
                                    onChange={(event) =>
                                        setSubmissionLinks((prev) => ({
                                            ...prev,
                                            [selectedActivity.id]: event.target.value,
                                        }))
                                    }
                                    placeholder="Submission URL"
                                    required
                                    disabled={!selectedActivity.isActive || selectedActivity.isCompleted || submittingActivityId === selectedActivity.id}
                                />
                                <button
                                    type="submit"
                                    disabled={!selectedActivity.isActive || selectedActivity.isCompleted || !((submissionLinks[selectedActivity.id] || '').trim()) || submittingActivityId === selectedActivity.id}
                                >
                                    {submittingActivityId === selectedActivity.id ? 'Submitting...' : 'Submit Link'}
                                </button>
                            </form>
                        ) : null}

                        {(selectedActivity.activityTypeCode === 'CORRECT_ANSWER' || selectedActivity.activityTypeCode === 'MANUAL_TEXT_SUBMISSION') ? (
                            <form className="stack" onSubmit={(event) => onSubmitActivity(event, selectedActivity)}>
                                <textarea
                                    value={submissionTexts[selectedActivity.id] || ''}
                                    onChange={(event) =>
                                        setSubmissionTexts((prev) => ({
                                            ...prev,
                                            [selectedActivity.id]: event.target.value,
                                        }))
                                    }
                                    placeholder={selectedActivity.activityTypeCode === 'CORRECT_ANSWER' ? 'Type your answer' : 'Type your submission text (max 300 chars)'}
                                    maxLength={300}
                                    rows={5}
                                    required
                                    disabled={!selectedActivity.isActive || selectedActivity.isCompleted || submittingActivityId === selectedActivity.id}
                                />
                                <div className="actions-row">
                                    <p className="tiny muted">{(submissionTexts[selectedActivity.id] || '').length}/300</p>
                                    <button
                                        type="submit"
                                        disabled={!selectedActivity.isActive || selectedActivity.isCompleted || !((submissionTexts[selectedActivity.id] || '').trim()) || submittingActivityId === selectedActivity.id}
                                    >
                                        {submittingActivityId === selectedActivity.id ? 'Submitting...' : (selectedActivity.activityTypeCode === 'CORRECT_ANSWER' ? 'Submit Answer' : 'Submit Text')}
                                    </button>
                                </div>
                            </form>
                        ) : null}

                        <button type="button" className="outline-button" onClick={closeActivityDialog}>
                            Close
                        </button>
                    </div>
                </div>
            ) : null}

            {submissionDialog.isOpen ? (
                <div className="admin-dialog-backdrop" role="presentation">
                    <div className="admin-dialog" role="dialog" aria-live="polite" aria-busy={submissionDialog.status === 'loading'}>
                        <h3>{submissionDialog.title}</h3>
                        <p className="muted">{submissionDialog.detail}</p>
                        {submissionDialog.status === 'loading' ? <div className="admin-spinner" /> : null}
                        {submissionDialog.status === 'success' ? <p className="status">Submission completed successfully.</p> : null}
                        {submissionDialog.status === 'error' ? <p className="error-banner">Submission failed.</p> : null}
                        <button type="button" onClick={closeSubmissionDialog} disabled={submissionDialog.status === 'loading'}>
                            {submissionDialog.status === 'loading' ? 'Submitting...' : 'Close'}
                        </button>
                    </div>
                </div>
            ) : null}
        </section>
    )
}
