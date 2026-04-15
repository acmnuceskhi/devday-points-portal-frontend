import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'
import { api } from '../lib/api'
import type {
    ActivityKind,
    ActivitySubmission,
    ActivityType,
    AdminParticipantDetail,
    Competition,
    CompetitionActivityPointsConfig,
    PointsAuditLog,
    PointsLeaderboardItem,
    RankingItem,
} from '../types/api'

type AdminTab = 'participant-workflow' | 'activities' | 'audit'

type ParticipantWorkflowTab =
    | 'participant-info'
    | 'competitions'
    | 'mark-completion'
    | 'adjust-points'
    | 'submissions'
    | 'completed-activities'

type ActivitiesTab = 'activity-management' | 'review-submissions' | 'points-config'
type ActivityManagementTab = 'competitions' | 'activities'

type ParticipantLookup = {
    participantId: string
    fullName: string
    institution: string | null
}

type ActionDialogState = {
    isOpen: boolean
    title: string
    status: 'loading' | 'success' | 'error'
    detail: string
}

const PARTICIPANT_LOOKUP_LIMIT = 100

const makeActivityCodePreview = (name: string) => {
    const base = name
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')

    return base || 'ACTIVITY'
}

export function AdminPointsPage() {
    const { accessToken, staffProfile, logout } = useAdminAuth()
    const navigate = useNavigate()

    const [activeTab, setActiveTab] = useState<AdminTab>('participant-workflow')
    const [activeParticipantWorkflowTab, setActiveParticipantWorkflowTab] = useState<ParticipantWorkflowTab>('participant-info')
    const [activeActivitiesTab, setActiveActivitiesTab] = useState<ActivitiesTab>('activity-management')
    const [activeActivityManagementTab, setActiveActivityManagementTab] = useState<ActivityManagementTab>('activities')
    const [participants, setParticipants] = useState<ParticipantLookup[]>([])
    const [activities, setActivities] = useState<ActivityType[]>([])
    const [activityKinds, setActivityKinds] = useState<ActivityKind[]>([])
    const [auditLogs, setAuditLogs] = useState<PointsAuditLog[]>([])
    const [selectedParticipantId, setSelectedParticipantId] = useState('')
    const [participantDetail, setParticipantDetail] = useState<AdminParticipantDetail | null>(null)
    const [participantDetailLoading, setParticipantDetailLoading] = useState(false)
    const [participantDetailError, setParticipantDetailError] = useState('')

    const [participantSearch, setParticipantSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [initialLoadError, setInitialLoadError] = useState('')
    const [submissionNotes, setSubmissionNotes] = useState<Record<string, string>>({})

    const [newActivityName, setNewActivityName] = useState('')
    const [newActivityDescription, setNewActivityDescription] = useState('')
    const [newActivityPoints, setNewActivityPoints] = useState('5')
    const [newActivityTypeId, setNewActivityTypeId] = useState('')
    const [newActivityCorrectAnswer, setNewActivityCorrectAnswer] = useState('')

    const [completionActivityId, setCompletionActivityId] = useState('')
    const [completionActivitySearch, setCompletionActivitySearch] = useState('')
    const [completionNote, setCompletionNote] = useState('')
    const [completionSubmissionEvidence, setCompletionSubmissionEvidence] = useState<ActivitySubmission | null>(null)
    const [completionSubmissionEvidenceLoading, setCompletionSubmissionEvidenceLoading] = useState(false)
    const [completionSubmissionEvidenceError, setCompletionSubmissionEvidenceError] = useState('')

    const [adjustPointsDelta, setAdjustPointsDelta] = useState('')
    const [adjustReason, setAdjustReason] = useState('')

    const [dialogState, setDialogState] = useState<ActionDialogState>({
        isOpen: false,
        title: '',
        status: 'loading',
        detail: '',
    })
    const [editingActivityId, setEditingActivityId] = useState('')
    const [editActivityName, setEditActivityName] = useState('')
    const [editActivityPoints, setEditActivityPoints] = useState('')
    const [editActivityDescription, setEditActivityDescription] = useState('')
    const [editActivityCorrectAnswer, setEditActivityCorrectAnswer] = useState('')
    const [editActivityError, setEditActivityError] = useState('')
    const [activitySearch, setActivitySearch] = useState('')
    const [reviewActivityId, setReviewActivityId] = useState('')
    const [reviewActivitySearch, setReviewActivitySearch] = useState('')
    const [reviewStatusFilter, setReviewStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | ''>('PENDING')
    const [activitySubmissions, setActivitySubmissions] = useState<ActivitySubmission[]>([])
    const [activitySubmissionsLoading, setActivitySubmissionsLoading] = useState(false)
    const [competitionList, setCompetitionList] = useState<Competition[]>([])
    const [competitionPointsConfig, setCompetitionPointsConfig] = useState<CompetitionActivityPointsConfig | null>(null)
    const [competitionPointsDefaultInput, setCompetitionPointsDefaultInput] = useState('0')
    const [competitionOverrideInputs, setCompetitionOverrideInputs] = useState<Record<string, string>>({})

    const openActionDialog = (title: string, detail = 'Please wait while we process your request...') => {
        setDialogState({ isOpen: true, title, status: 'loading', detail })
    }

    const showActionSuccess = (title: string, detail: string) => {
        setDialogState({ isOpen: true, title, status: 'success', detail })
    }

    const showActionError = (title: string, detail: string) => {
        setDialogState({ isOpen: true, title, status: 'error', detail })
    }

    const closeDialog = () => {
        if (dialogState.status === 'loading') return
        setDialogState((prev) => ({ ...prev, isOpen: false }))
    }

    const applyCompetitionPointsConfig = (config: CompetitionActivityPointsConfig) => {
        setCompetitionPointsConfig(config)
        setCompetitionPointsDefaultInput(String(config.globalDefaultPoints ?? 0))
        const nextOverrides: Record<string, string> = {}
        for (const item of config.overrides) {
            nextOverrides[item.competitionId] = String(item.points ?? '')
        }
        setCompetitionOverrideInputs(nextOverrides)
    }

    const toParticipantLookup = (items: Array<RankingItem | PointsLeaderboardItem>): ParticipantLookup[] => {
        const lookup = new Map<string, ParticipantLookup>()
        for (const item of items) {
            if (!lookup.has(item.participantId)) {
                lookup.set(item.participantId, {
                    participantId: item.participantId,
                    fullName: item.fullName,
                    institution: item.institution,
                })
            }
        }

        return Array.from(lookup.values()).sort((a, b) => a.fullName.localeCompare(b.fullName))
    }

    const refreshGlobalData = async () => {
        if (!accessToken) return

        const [activityData, kindsData, auditData, rankingsResult, leaderboardResult, competitionData, pointsConfig] = await Promise.all([
            api.getAdminActivityTypes(accessToken, true),
            api.getAdminActivityKinds(accessToken),
            api.getAdminAuditLogs(accessToken, 30, 0),
            api.getRankings(PARTICIPANT_LOOKUP_LIMIT, 0),
            api.getPointsLeaderboard(PARTICIPANT_LOOKUP_LIMIT, 0),
            api.getCompetitions(true),
            api.getAdminCompetitionActivityPointsConfig(accessToken),
        ])

        setActivities(activityData)
        setActivityKinds(kindsData)
        setAuditLogs(auditData)
        setCompetitionList(competitionData)
        setParticipants(toParticipantLookup([...rankingsResult.items, ...leaderboardResult.items]))
        applyCompetitionPointsConfig(pointsConfig)

        if (!newActivityTypeId && kindsData[0]) {
            setNewActivityTypeId(kindsData[0].id)
        }
    }

    const refreshParticipantDetails = async (participantId: string) => {
        if (!accessToken || !participantId) {
            setParticipantDetail(null)
            setParticipantDetailError('')
            return
        }

        const detail = await api.getAdminParticipantDetails(accessToken, participantId)
        const pending = await api.getAdminPendingSubmissions(accessToken, participantId)
        setParticipantDetail({ ...detail, pendingSubmissions: pending })
    }

    const refreshSelectedParticipantDetails = async () => {
        if (!selectedParticipantId) return

        setParticipantDetailLoading(true)
        setParticipantDetailError('')
        try {
            await refreshParticipantDetails(selectedParticipantId)
        } catch (error) {
            setParticipantDetailError(error instanceof Error ? error.message : 'Could not refresh participant details')
        } finally {
            setParticipantDetailLoading(false)
        }
    }

    const loadSubmissionsByActivity = async () => {
        if (!accessToken || !reviewActivityId) {
            setActivitySubmissions([])
            return
        }

        setActivitySubmissionsLoading(true)
        try {
            const rows = await api.getAdminSubmissionsByActivity(accessToken, {
                activityId: reviewActivityId,
                status: reviewStatusFilter || undefined,
                limit: 100,
                offset: 0,
            })
            setActivitySubmissions(rows)
        } finally {
            setActivitySubmissionsLoading(false)
        }
    }

    useEffect(() => {
        async function load() {
            if (!accessToken) return

            setLoading(true)
            setInitialLoadError('')
            try {
                await refreshGlobalData()
            } catch (error) {
                setInitialLoadError(error instanceof Error ? error.message : 'Failed to load admin data')
            } finally {
                setLoading(false)
            }
        }

        void load()
    }, [accessToken])

    useEffect(() => {
        if (!selectedParticipantId) {
            setParticipantDetail(null)
            setParticipantDetailError('')
            setParticipantDetailLoading(false)
            return
        }

        let isCurrent = true

        const run = async () => {
            setParticipantDetailLoading(true)
            setParticipantDetailError('')
            try {
                await refreshParticipantDetails(selectedParticipantId)
            } catch (error) {
                if (!isCurrent) return
                setParticipantDetail(null)
                setParticipantDetailError(error instanceof Error ? error.message : 'Could not load participant details')
            } finally {
                if (isCurrent) {
                    setParticipantDetailLoading(false)
                }
            }
        }

        void run()

        return () => {
            isCurrent = false
        }
    }, [accessToken, selectedParticipantId])

    useEffect(() => {
        if (!accessToken || !reviewActivityId) {
            setActivitySubmissions([])
            return
        }

        void loadSubmissionsByActivity()
    }, [accessToken, reviewActivityId, reviewStatusFilter])

    useEffect(() => {
        if (!accessToken || !selectedParticipantId || !completionActivityId) {
            setCompletionSubmissionEvidence(null)
            setCompletionSubmissionEvidenceError('')
            setCompletionSubmissionEvidenceLoading(false)
            return
        }

        let isCurrent = true

        const loadEvidence = async () => {
            setCompletionSubmissionEvidenceLoading(true)
            setCompletionSubmissionEvidenceError('')
            try {
                const evidence = await api.getAdminLatestParticipantActivitySubmission(
                    accessToken,
                    selectedParticipantId,
                    completionActivityId,
                )

                if (!isCurrent) return
                setCompletionSubmissionEvidence(evidence)
            } catch (error) {
                if (!isCurrent) return
                setCompletionSubmissionEvidence(null)
                setCompletionSubmissionEvidenceError(
                    error instanceof Error ? error.message : 'Could not load latest submission evidence',
                )
            } finally {
                if (isCurrent) {
                    setCompletionSubmissionEvidenceLoading(false)
                }
            }
        }

        void loadEvidence()

        return () => {
            isCurrent = false
        }
    }, [accessToken, selectedParticipantId, completionActivityId])

    const filteredParticipants = useMemo(() => {
        const needle = participantSearch.trim().toLowerCase()
        if (!needle) return participants.slice(0, 20)

        return participants
            .filter((item) => {
                return (
                    item.fullName.toLowerCase().includes(needle) ||
                    (item.institution || '').toLowerCase().includes(needle) ||
                    item.participantId.toLowerCase().includes(needle)
                )
            })
            .slice(0, 30)
    }, [participantSearch, participants])

    const filteredCompletionActivities = useMemo(() => {
        const needle = completionActivitySearch.trim().toLowerCase()
        if (!needle) return activities.slice(0, 40)

        return activities
            .filter((item) => {
                return (
                    item.name.toLowerCase().includes(needle) ||
                    item.code.toLowerCase().includes(needle) ||
                    item.activityTypeCode.toLowerCase().includes(needle) ||
                    (item.description || '').toLowerCase().includes(needle)
                )
            })
            .slice(0, 40)
    }, [activities, completionActivitySearch])

    const selectedCompletionActivity = useMemo(
        () => activities.find((item) => item.id === completionActivityId) || null,
        [activities, completionActivityId],
    )

    const filteredReviewActivities = useMemo(() => {
        const needle = reviewActivitySearch.trim().toLowerCase()
        if (!needle) return activities.slice(0, 40)

        return activities
            .filter((item) => {
                return (
                    item.name.toLowerCase().includes(needle) ||
                    item.code.toLowerCase().includes(needle) ||
                    item.activityTypeCode.toLowerCase().includes(needle) ||
                    (item.description || '').toLowerCase().includes(needle)
                )
            })
            .slice(0, 40)
    }, [activities, reviewActivitySearch])

    const selectedReviewActivity = useMemo(
        () => activities.find((item) => item.id === reviewActivityId) || null,
        [activities, reviewActivityId],
    )

    const editingActivity = useMemo(
        () => activities.find((item) => item.id === editingActivityId) || null,
        [activities, editingActivityId],
    )

    const filteredActivities = useMemo(() => {
        const needle = activitySearch.trim().toLowerCase()
        if (!needle) return activities

        return activities.filter((item) => {
            return (
                item.code.toLowerCase().includes(needle) ||
                item.name.toLowerCase().includes(needle) ||
                item.activityTypeCode.toLowerCase().includes(needle) ||
                (item.description || '').toLowerCase().includes(needle)
            )
        })
    }, [activities, activitySearch])

    const competitionActivities = useMemo(
        () => filteredActivities.filter((item) => item.code.endsWith('_PARTICIPATION')),
        [filteredActivities],
    )

    const regularActivities = useMemo(
        () => filteredActivities.filter((item) => !item.code.endsWith('_PARTICIPATION')),
        [filteredActivities],
    )

    const displayedActivities = useMemo(
        () => (activeActivityManagementTab === 'competitions' ? competitionActivities : regularActivities),
        [activeActivityManagementTab, competitionActivities, regularActivities],
    )

    const selectedNewActivityKind = useMemo(
        () => activityKinds.find((kind) => kind.id === newActivityTypeId) || null,
        [activityKinds, newActivityTypeId],
    )

    const selectedParticipant = useMemo(
        () => participants.find((item) => item.participantId === selectedParticipantId) || null,
        [participants, selectedParticipantId],
    )

    const newActivityCodePreview = useMemo(() => makeActivityCodePreview(newActivityName), [newActivityName])

    const onLogout = () => {
        logout()
        navigate('/admin/login', { replace: true })
    }

    const onCreateActivity = async (event: FormEvent) => {
        event.preventDefault()
        if (!accessToken) return

        try {
            openActionDialog('Creating Activity')
            await api.createAdminActivityType(accessToken, {
                name: newActivityName.trim(),
                description: newActivityDescription.trim() || undefined,
                points: Number(newActivityPoints),
                activityTypeId: newActivityTypeId,
                correctAnswerCanonical:
                    selectedNewActivityKind?.code === 'CORRECT_ANSWER'
                        ? (newActivityCorrectAnswer.trim() || undefined)
                        : undefined,
                isActive: true,
            })
            await refreshGlobalData()
            setNewActivityName('')
            setNewActivityDescription('')
            setNewActivityPoints('5')
            setNewActivityCorrectAnswer('')
            showActionSuccess('Activity Created', 'Activity was created successfully.')
        } catch (error) {
            showActionError('Could Not Create Activity', error instanceof Error ? error.message : 'Create failed')
        }
    }

    const onStartEditActivity = (activity: ActivityType) => {
        setEditingActivityId(activity.id)
        setEditActivityName(activity.name)
        setEditActivityPoints(String(activity.points))
        setEditActivityDescription(activity.description || '')
        setEditActivityCorrectAnswer(activity.correctAnswerCanonical || '')
        setEditActivityError('')
    }

    const onCancelEditActivity = () => {
        setEditingActivityId('')
        setEditActivityName('')
        setEditActivityPoints('')
        setEditActivityDescription('')
        setEditActivityCorrectAnswer('')
        setEditActivityError('')
    }

    const onSaveEditActivity = async () => {
        if (!accessToken || !editingActivityId || !editingActivity) return

        const isCorrectAnswerActivity = editingActivity.activityTypeCode === 'CORRECT_ANSWER'
        if (isCorrectAnswerActivity && !editActivityCorrectAnswer.trim()) {
            setEditActivityError('Correct answer is required for CORRECT_ANSWER activities.')
            return
        }

        setEditActivityError('')

        try {
            openActionDialog('Updating Activity')
            await api.updateAdminActivityType(accessToken, editingActivityId, {
                name: editActivityName.trim(),
                points: Number(editActivityPoints),
                description: editActivityDescription.trim() || null,
                correctAnswerCanonical: isCorrectAnswerActivity ? editActivityCorrectAnswer.trim() : undefined,
            })
            await refreshGlobalData()
            if (reviewActivityId) {
                await loadSubmissionsByActivity()
            }
            onCancelEditActivity()
            showActionSuccess('Activity Updated', 'Activity details were updated successfully.')
        } catch (error) {
            showActionError('Could Not Update Activity', error instanceof Error ? error.message : 'Update failed')
        }
    }

    const onToggleActivityStatus = async (activity: ActivityType) => {
        if (!accessToken) return

        const nextState = !activity.isActive
        const actionLabel = nextState ? 'Activate' : 'Deactivate'
        const confirmed = window.confirm(`${actionLabel} activity "${activity.name}"?`)
        if (!confirmed) return

        try {
            openActionDialog(`${actionLabel} Activity`)
            await api.toggleAdminActivityStatus(accessToken, activity.id, nextState)
            await refreshGlobalData()
            showActionSuccess('Activity State Updated', `Activity is now ${nextState ? 'active' : 'inactive'}.`)
        } catch (error) {
            showActionError('Could Not Update Activity State', error instanceof Error ? error.message : 'Update failed')
        }
    }

    const onMarkCompletion = async (event: FormEvent) => {
        event.preventDefault()
        if (!accessToken || !selectedParticipantId) return

        try {
            openActionDialog('Marking Completion')
            await api.markAdminCompletion(accessToken, {
                participantId: selectedParticipantId,
                activityId: completionActivityId,
                note: completionNote.trim() || undefined,
            })
            await refreshParticipantDetails(selectedParticipantId)
            await refreshGlobalData()
            setCompletionNote('')
            setCompletionSubmissionEvidence(null)
            showActionSuccess('Completion Marked', 'Points have been granted to the participant.')
        } catch (error) {
            showActionError('Could Not Mark Completion', error instanceof Error ? error.message : 'Completion failed')
        }
    }

    const onAdjustPoints = async (event: FormEvent) => {
        event.preventDefault()
        if (!accessToken || !selectedParticipantId) return

        try {
            openActionDialog('Applying Points Adjustment')
            await api.adjustAdminPoints(accessToken, {
                participantId: selectedParticipantId,
                pointsDelta: Number(adjustPointsDelta),
                reason: adjustReason.trim() || undefined,
            })
            await refreshParticipantDetails(selectedParticipantId)
            await refreshGlobalData()
            setAdjustPointsDelta('')
            setAdjustReason('')
            showActionSuccess('Points Updated', 'Points adjustment completed.')
        } catch (error) {
            showActionError('Could Not Adjust Points', error instanceof Error ? error.message : 'Adjustment failed')
        }
    }

    const onRevokeCompletion = async (completionId: string) => {
        if (!accessToken || !selectedParticipantId) return

        try {
            openActionDialog('Reversing Completion')
            await api.revokeAdminCompletion(accessToken, completionId, 'Reversed by admin review')
            await refreshParticipantDetails(selectedParticipantId)
            await refreshGlobalData()
            showActionSuccess('Completion Reversed', 'Completion and points were reverted and logged.')
        } catch (error) {
            showActionError('Could Not Reverse Completion', error instanceof Error ? error.message : 'Reversal failed')
        }
    }

    const onApproveSubmission = async (submission: ActivitySubmission) => {
        if (!accessToken) return

        try {
            openActionDialog('Approving Submission')
            await api.approveAdminSubmission(accessToken, submission.id, submissionNotes[submission.id]?.trim() || undefined)
            if (selectedParticipantId && submission.participantId === selectedParticipantId) {
                await refreshSelectedParticipantDetails()
            }
            if (reviewActivityId) {
                await loadSubmissionsByActivity()
            }
            await refreshGlobalData()
            showActionSuccess('Submission Approved', 'Submission approved and points awarded.')
        } catch (error) {
            showActionError('Could Not Approve Submission', error instanceof Error ? error.message : 'Approval failed')
        }
    }

    const onRejectSubmission = async (submission: ActivitySubmission) => {
        if (!accessToken) return

        try {
            openActionDialog('Rejecting Submission')
            await api.rejectAdminSubmission(accessToken, submission.id, submissionNotes[submission.id]?.trim() || 'Rejected by admin')
            if (selectedParticipantId && submission.participantId === selectedParticipantId) {
                await refreshSelectedParticipantDetails()
            }
            if (reviewActivityId) {
                await loadSubmissionsByActivity()
            }
            await refreshGlobalData()
            showActionSuccess('Submission Rejected', 'Submission has been rejected and logged.')
        } catch (error) {
            showActionError('Could Not Reject Submission', error instanceof Error ? error.message : 'Rejection failed')
        }
    }

    const onUpdateCompetitionDefaultPoints = async (event: FormEvent) => {
        event.preventDefault()
        if (!accessToken) return

        try {
            openActionDialog('Updating Competition Default Points')
            const updated = await api.updateAdminCompetitionActivityPointsDefault(accessToken, Number(competitionPointsDefaultInput))
            applyCompetitionPointsConfig(updated)
            showActionSuccess('Configuration Updated', 'Global default competition activity points updated.')
        } catch (error) {
            showActionError('Could Not Update Configuration', error instanceof Error ? error.message : 'Update failed')
        }
    }

    const onSaveCompetitionOverride = async (competitionId: string) => {
        if (!accessToken) return

        const value = competitionOverrideInputs[competitionId]
        if (!value?.trim()) return

        try {
            openActionDialog('Updating Competition Override')
            const updated = await api.upsertAdminCompetitionActivityPointsOverride(accessToken, competitionId, Number(value))
            applyCompetitionPointsConfig(updated)
            showActionSuccess('Override Updated', 'Competition-specific points override saved.')
        } catch (error) {
            showActionError('Could Not Update Override', error instanceof Error ? error.message : 'Update failed')
        }
    }

    const onClearCompetitionOverride = async (competitionId: string) => {
        if (!accessToken) return

        try {
            openActionDialog('Clearing Competition Override')
            const updated = await api.deleteAdminCompetitionActivityPointsOverride(accessToken, competitionId)
            applyCompetitionPointsConfig(updated)
            showActionSuccess('Override Cleared', 'Competition-specific override removed.')
        } catch (error) {
            showActionError('Could Not Clear Override', error instanceof Error ? error.message : 'Clear failed')
        }
    }

    return (
        <section className="stack admin-workspace" style={{ width: 'min(1260px, calc(100% - 24px))', margin: '20px auto' }}>
            <div className="section-head admin-hero">
                <div className="actions-row portal-title-wrap">
                    <img
                        src="/devday-logo.png"
                        alt="DevDay logo"
                        className="portal-heading-logo"
                        style={{ width: 52, height: 72, objectFit: 'contain' }}
                    />
                    <div className="portal-title-block">
                        <p className="eyebrow">DEVDAY '26</p>
                        <h2 className="admin-title-main">Admin Panel</h2>
                        <p className="muted tiny">
                            Signed in as <strong>{staffProfile?.fullName || 'Admin'}</strong> ({staffProfile?.staffRole || 'STAFF'})
                        </p>
                    </div>
                </div>
                <div className="actions-row">
                    <Link className="link-button" to="/">
                        Participant Portal
                    </Link>
                    <button className="outline-button" onClick={onLogout} type="button">
                        Logout
                    </button>
                </div>
            </div>

            {loading ? <div className="center-state">Loading admin data...</div> : null}
            {initialLoadError ? <div className="error-banner">{initialLoadError}</div> : null}

            <div className="admin-subtabs" role="tablist" aria-label="Admin workflows">
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'participant-workflow'}
                    className={`admin-subtab ${activeTab === 'participant-workflow' ? 'active' : ''}`}
                    onClick={() => setActiveTab('participant-workflow')}
                >
                    Participant Workflow
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'activities'}
                    className={`admin-subtab ${activeTab === 'activities' ? 'active' : ''}`}
                    onClick={() => setActiveTab('activities')}
                >
                    Activities
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'audit'}
                    className={`admin-subtab ${activeTab === 'audit' ? 'active' : ''}`}
                    onClick={() => setActiveTab('audit')}
                >
                    Audit Logs
                </button>
            </div>

            {activeTab === 'participant-workflow' ? (
                <div className="admin-layout">
                    <aside className="admin-left-panel stack border-b border-[#2f2f39] pb-4">
                        <div className="section-head">
                            <h3>Participants</h3>
                            <p className="muted tiny">Search and select</p>
                        </div>
                        <input
                            value={participantSearch}
                            onChange={(event) => setParticipantSearch(event.target.value)}
                            placeholder="Search by name, institution, or id"
                        />
                        <div className="participant-search-results">
                            {filteredParticipants.map((item) => (
                                <button
                                    key={item.participantId}
                                    type="button"
                                    className={`participant-item ${selectedParticipantId === item.participantId ? 'selected' : ''}`}
                                    aria-pressed={selectedParticipantId === item.participantId}
                                    onClick={() => setSelectedParticipantId(item.participantId)}
                                >
                                    <span>
                                        <strong>{item.fullName}</strong>
                                        <small>{item.institution || 'No institution'}</small>
                                    </span>
                                    {selectedParticipantId === item.participantId ? (
                                        <span className="selection-badge">Selected</span>
                                    ) : null}
                                </button>
                            ))}
                        </div>
                    </aside>

                    <div className="stack admin-right-panel">
                        <div className="admin-subtabs admin-inner-subtabs" role="tablist" aria-label="Participant workflow sections">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeParticipantWorkflowTab === 'participant-info'}
                                className={`admin-subtab ${activeParticipantWorkflowTab === 'participant-info' ? 'active' : ''}`}
                                onClick={() => setActiveParticipantWorkflowTab('participant-info')}
                            >
                                Participant Info
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeParticipantWorkflowTab === 'competitions'}
                                className={`admin-subtab ${activeParticipantWorkflowTab === 'competitions' ? 'active' : ''}`}
                                onClick={() => setActiveParticipantWorkflowTab('competitions')}
                            >
                                Competitions
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeParticipantWorkflowTab === 'mark-completion'}
                                className={`admin-subtab ${activeParticipantWorkflowTab === 'mark-completion' ? 'active' : ''}`}
                                onClick={() => setActiveParticipantWorkflowTab('mark-completion')}
                            >
                                Mark Completion
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeParticipantWorkflowTab === 'adjust-points'}
                                className={`admin-subtab ${activeParticipantWorkflowTab === 'adjust-points' ? 'active' : ''}`}
                                onClick={() => setActiveParticipantWorkflowTab('adjust-points')}
                            >
                                Adjust Points
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeParticipantWorkflowTab === 'submissions'}
                                className={`admin-subtab ${activeParticipantWorkflowTab === 'submissions' ? 'active' : ''}`}
                                onClick={() => setActiveParticipantWorkflowTab('submissions')}
                            >
                                Pending Submissions
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeParticipantWorkflowTab === 'completed-activities'}
                                className={`admin-subtab ${activeParticipantWorkflowTab === 'completed-activities' ? 'active' : ''}`}
                                onClick={() => setActiveParticipantWorkflowTab('completed-activities')}
                            >
                                Completed Activities
                            </button>
                        </div>

                        <article
                            className={`stack border-b pb-4 ${selectedParticipant ? 'border-[#ff2a2f]' : 'border-[#2f2f39]'}`}
                        >
                            <div className="actions-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                <p className="tiny muted">Current Participant</p>
                                <div className="actions-row">
                                    {participantDetailLoading ? (
                                        <>
                                            <div className="admin-spinner" aria-hidden="true" />
                                            <span className="tiny muted">Refreshing...</span>
                                        </>
                                    ) : null}
                                    <button
                                        type="button"
                                        className="outline-button"
                                        disabled={!selectedParticipantId || participantDetailLoading}
                                        onClick={() => {
                                            void refreshSelectedParticipantDetails()
                                        }}
                                    >
                                        Refresh
                                    </button>
                                </div>
                            </div>
                            {participantDetailError ? <div className="error-banner">{participantDetailError}</div> : null}
                        </article>

                        {activeParticipantWorkflowTab === 'participant-info' ? (
                            <article
                                className={`stack border-b pb-4 ${selectedParticipant ? 'border-[#ff2a2f]' : 'border-[#2f2f39]'}`}
                            >
                                {participantDetail ? (
                                    <div className="data-list compact">
                                        <div>
                                            <dt>Name</dt>
                                            <dd>{participantDetail.participant.fullName}</dd>
                                        </div>
                                        <div>
                                            <dt>Total Points</dt>
                                            <dd>{participantDetail.summary.totalPoints}</dd>
                                        </div>
                                        <div>
                                            <dt>Institution</dt>
                                            <dd>{participantDetail.participant.institution || '-'}</dd>
                                        </div>
                                        <div>
                                            <dt>Email</dt>
                                            <dd>{participantDetail.participant.email || '-'}</dd>
                                        </div>
                                        <div>
                                            <dt>Phone</dt>
                                            <dd>{participantDetail.participant.phone || '-'}</dd>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="muted">Select a participant from the left panel.</p>
                                )}
                            </article>
                        ) : null}

                        {activeParticipantWorkflowTab === 'competitions' ? (
                            <article className="admin-flow-card table-wrap table-scroll-y border-b border-[#2f2f39] pb-4">
                                <h3>Participant Competitions</h3>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Competition</th>
                                            <th>Team</th>
                                            <th>Date & Time</th>
                                            <th>Venue</th>
                                            <th>Payment</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(participantDetail?.competitions || []).map((item) => (
                                            <tr key={`${item.teamId}-${item.competitionId}`}>
                                                <td>{item.competitionName}</td>
                                                <td>
                                                    {item.teamName} {item.isLeader ? '(Leader)' : ''}
                                                </td>
                                                <td>
                                                    {new Date(item.compDay).toLocaleDateString()} | {item.startTime || '-'} - {item.endTime || '-'}
                                                </td>
                                                <td>{item.venueName || 'TBA'}</td>
                                                <td>{item.paymentStatus}</td>
                                            </tr>
                                        ))}
                                        {!participantDetail?.competitions.length ? (
                                            <tr>
                                                <td colSpan={5} className="muted">
                                                    No competition registrations found.
                                                </td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </article>
                        ) : null}

                        {activeParticipantWorkflowTab === 'mark-completion' ? (
                            <article className="admin-flow-card stack border-b border-[#2f2f39] pb-4">
                                <h3>Mark Activity Completion</h3>
                                <div className="grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)] lg:items-start">
                                    <section className="min-w-0 border border-[#2f2f39] bg-[#121218]">
                                        <div className="border-b border-[#2f2f39] p-3">
                                            <p className="text-[11px] uppercase tracking-[0.12em] text-[#b8b8c2]">Activity Selector</p>
                                            <input
                                                value={completionActivitySearch}
                                                onChange={(event) => setCompletionActivitySearch(event.target.value)}
                                                placeholder="Search activities by code, name, type, or description"
                                                className="mt-2"
                                            />
                                        </div>

                                        <div className="grid gap-2 p-2 lg:h-128 lg:overflow-y-auto">
                                            {filteredCompletionActivities.map((item) => (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    aria-pressed={completionActivityId === item.id}
                                                    onClick={() => setCompletionActivityId(item.id)}
                                                    className={`relative min-w-0 rounded-md border px-3 py-2.5 text-left transition ${
                                                        completionActivityId === item.id
                                                            ? 'border-[#ff2a2f] bg-[#231317]'
                                                            : 'border-[#33333d] bg-[#17171d] hover:border-[#ff2a2f]/60'
                                                    }`}
                                                >
                                                    {completionActivityId === item.id ? (
                                                        <span className="absolute right-2 top-2 text-[10px] font-bold uppercase tracking-widest text-[#ff7d80]">
                                                            Selected
                                                        </span>
                                                    ) : null}
                                                    <p className="pr-16 text-sm font-semibold leading-snug text-white line-clamp-2">{item.name}</p>
                                                    <p className="mt-1 text-xs leading-snug text-[#b8b8c2] truncate">
                                                        {item.code} | {item.activityTypeCode}
                                                    </p>
                                                </button>
                                            ))}
                                            {!filteredCompletionActivities.length ? (
                                                <p className="p-2 text-xs text-[#b8b8c2]">No activities match this search.</p>
                                            ) : null}
                                        </div>
                                    </section>

                                    <section className="min-w-0 stack self-start">
                                        <div className="border border-dashed border-[#3a3a44] p-3">
                                            <p className="tiny muted" style={{ marginBottom: 4 }}>
                                                Selected activity
                                            </p>
                                            {selectedCompletionActivity ? (
                                                <p>
                                                    <strong>{selectedCompletionActivity.name}</strong>
                                                    <br />
                                                    <span className="tiny muted">
                                                        {selectedCompletionActivity.code} ({selectedCompletionActivity.activityTypeCode})
                                                    </span>
                                                </p>
                                            ) : (
                                                <p className="tiny muted">Choose an activity from the left column.</p>
                                            )}
                                        </div>

                                        <form className="grid two" onSubmit={onMarkCompletion}>
                                            <input
                                                value={completionNote}
                                                onChange={(event) => setCompletionNote(event.target.value)}
                                                placeholder="Note (optional)"
                                            />
                                            <button type="submit" disabled={!selectedParticipantId || !completionActivityId}>
                                                Mark Completion
                                            </button>
                                        </form>
                                    </section>
                                </div>

                                {completionActivityId ? (
                                    <div className="stack border border-dashed border-[#3a3a44] p-3" style={{ margin: 0 }}>
                                        <div className="section-head">
                                            <h4>Latest Submission Evidence</h4>
                                            {completionSubmissionEvidenceLoading ? <span className="tiny muted">Loading...</span> : null}
                                        </div>
                                        {completionSubmissionEvidenceError ? (
                                            <p className="error-banner">{completionSubmissionEvidenceError}</p>
                                        ) : null}
                                        {!completionSubmissionEvidenceLoading && !completionSubmissionEvidenceError ? (
                                            completionSubmissionEvidence ? (
                                                <div className="stack">
                                                    <div className="data-list compact">
                                                        <div>
                                                            <dt>Status</dt>
                                                            <dd>{completionSubmissionEvidence.status}</dd>
                                                        </div>
                                                        <div>
                                                            <dt>Submitted</dt>
                                                            <dd>{new Date(completionSubmissionEvidence.submittedAt).toLocaleString()}</dd>
                                                        </div>
                                                        <div>
                                                            <dt>Reviewed</dt>
                                                            <dd>
                                                                {completionSubmissionEvidence.reviewedAt
                                                                    ? new Date(completionSubmissionEvidence.reviewedAt).toLocaleString()
                                                                    : '-'}
                                                            </dd>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="tiny muted" style={{ marginBottom: 6 }}>
                                                            Submitted content
                                                        </p>
                                                        {completionSubmissionEvidence.submissionLink ? (
                                                            <a
                                                                href={completionSubmissionEvidence.submissionLink}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                Open submitted link
                                                            </a>
                                                        ) : (
                                                            <p className="tiny">{completionSubmissionEvidence.submissionText || '-'}</p>
                                                        )}
                                                    </div>
                                                    {completionSubmissionEvidence.reviewNote ? (
                                                        <p className="tiny muted">Last review note: {completionSubmissionEvidence.reviewNote}</p>
                                                    ) : null}
                                                </div>
                                            ) : (
                                                <p className="muted tiny">
                                                    No submission evidence found for this participant and activity. You can still mark completion manually.
                                                </p>
                                            )
                                        ) : null}
                                    </div>
                                ) : null}
                            </article>
                        ) : null}

                        {activeParticipantWorkflowTab === 'adjust-points' ? (
                            <article className="admin-flow-card stack border-b border-[#2f2f39] pb-4">
                                <h3>Adjust Points</h3>
                                <form className="grid two" onSubmit={onAdjustPoints}>
                                    <input
                                        type="number"
                                        min={-1000}
                                        max={1000}
                                        value={adjustPointsDelta}
                                        onChange={(event) => setAdjustPointsDelta(event.target.value)}
                                        placeholder="Points Delta"
                                        required
                                    />
                                    <input
                                        value={adjustReason}
                                        onChange={(event) => setAdjustReason(event.target.value)}
                                        placeholder="Reason (optional)"
                                    />
                                    <button type="submit" disabled={!selectedParticipantId}>
                                        Apply Adjustment
                                    </button>
                                </form>
                            </article>
                        ) : null}

                        {activeParticipantWorkflowTab === 'submissions' ? (
                            <article className="admin-flow-card table-wrap table-scroll-y border-b border-[#2f2f39] pb-4">
                                <h3>Pending Submissions</h3>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Activity</th>
                                            <th>Submitted At</th>
                                            <th>Submission</th>
                                            <th>Review Note</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(participantDetail?.pendingSubmissions || []).map((submission) => (
                                            <tr key={submission.id}>
                                                <td>{submission.activityName}</td>
                                                <td>{new Date(submission.submittedAt).toLocaleString()}</td>
                                                <td>
                                                    {submission.submissionLink ? (
                                                        <a href={submission.submissionLink} target="_blank" rel="noreferrer">
                                                            Open Link
                                                        </a>
                                                    ) : (
                                                        <span>{submission.submissionText || '-'}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <input
                                                        value={submissionNotes[submission.id] || ''}
                                                        onChange={(event) =>
                                                            setSubmissionNotes((prev) => ({ ...prev, [submission.id]: event.target.value }))
                                                        }
                                                        placeholder="Review note"
                                                    />
                                                </td>
                                                <td>
                                                    <div className="actions-row">
                                                        <button type="button" onClick={() => onApproveSubmission(submission)}>
                                                            Approve
                                                        </button>
                                                        <button type="button" className="outline-button" onClick={() => onRejectSubmission(submission)}>
                                                            Reject
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {!participantDetail?.pendingSubmissions.length ? (
                                            <tr>
                                                <td colSpan={5} className="muted">
                                                    No pending submissions for this participant.
                                                </td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </article>
                        ) : null}

                        {activeParticipantWorkflowTab === 'completed-activities' ? (
                            <article className="admin-flow-card table-wrap table-scroll-y border-b border-[#2f2f39] pb-4">
                                <h3>Completed Activities</h3>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Activity</th>
                                            <th>Points</th>
                                            <th>Completed At</th>
                                            <th>Source Link</th>
                                            <th>Reverse</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(participantDetail?.completions || []).map((completion) => (
                                            <tr key={completion.id}>
                                                <td>{completion.activityName}</td>
                                                <td>{completion.points}</td>
                                                <td>{new Date(completion.completedAt).toLocaleString()}</td>
                                                <td>
                                                    {completion.submissionLink ? (
                                                        <a href={completion.submissionLink} target="_blank" rel="noreferrer">
                                                            Open
                                                        </a>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td>
                                                    <button type="button" className="outline-button" onClick={() => onRevokeCompletion(completion.id)}>
                                                        Reverse
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {!participantDetail?.completions.length ? (
                                            <tr>
                                                <td colSpan={5} className="muted">
                                                    No completed activities yet.
                                                </td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </article>
                        ) : null}
                    </div>
                </div>
            ) : null}

            {activeTab === 'activities' ? (
                <div className="stack admin-layout-single">
                    <div className="stack admin-right-panel">
                        <div className="admin-subtabs admin-inner-subtabs" role="tablist" aria-label="Activities sections">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeActivitiesTab === 'activity-management'}
                                className={`admin-subtab ${activeActivitiesTab === 'activity-management' ? 'active' : ''}`}
                                onClick={() => setActiveActivitiesTab('activity-management')}
                            >
                                Activity Management
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeActivitiesTab === 'review-submissions'}
                                className={`admin-subtab ${activeActivitiesTab === 'review-submissions' ? 'active' : ''}`}
                                onClick={() => setActiveActivitiesTab('review-submissions')}
                            >
                                Review Submissions
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeActivitiesTab === 'points-config'}
                                className={`admin-subtab ${activeActivitiesTab === 'points-config' ? 'active' : ''}`}
                                onClick={() => setActiveActivitiesTab('points-config')}
                            >
                                Points Configuration
                            </button>
                        </div>

                        <div className="stack">
                            {activeActivitiesTab === 'activity-management' ? (
                                <>
                                    {activeActivityManagementTab === 'activities' ? (
                                        <article className="admin-flow-card stack border-b border-[#2f2f39] pb-4">
                                            <h3>Create Activity</h3>
                                            <form className="grid two" onSubmit={onCreateActivity}>
                                                <input
                                                    value={newActivityName}
                                                    onChange={(event) => setNewActivityName(event.target.value)}
                                                    placeholder="Name"
                                                    required
                                                />
                                                <div className="border border-dashed border-[#3a3a44] p-2.5" style={{ margin: 0 }}>
                                                    <p className="tiny muted" style={{ marginBottom: 4 }}>
                                                        Code preview (auto-generated)
                                                    </p>
                                                    <strong>{newActivityCodePreview}</strong>
                                                </div>
                                                <select
                                                    value={newActivityTypeId}
                                                    onChange={(event) => setNewActivityTypeId(event.target.value)}
                                                    required
                                                >
                                                    <option value="">Select Activity Type</option>
                                                    {activityKinds.map((kind) => (
                                                        <option key={kind.id} value={kind.id}>
                                                            {kind.name} ({kind.code})
                                                        </option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={1000}
                                                    value={newActivityPoints}
                                                    onChange={(event) => setNewActivityPoints(event.target.value)}
                                                    placeholder="Points"
                                                    required
                                                />
                                                <input
                                                    value={newActivityDescription}
                                                    onChange={(event) => setNewActivityDescription(event.target.value)}
                                                    placeholder="Description (optional)"
                                                />
                                                {selectedNewActivityKind?.code === 'CORRECT_ANSWER' ? (
                                                    <input
                                                        value={newActivityCorrectAnswer}
                                                        onChange={(event) => setNewActivityCorrectAnswer(event.target.value)}
                                                        placeholder="Canonical correct answer"
                                                        required
                                                    />
                                                ) : null}
                                                <button type="submit">Create Activity</button>
                                            </form>
                                        </article>
                                    ) : (
                                        <article className="admin-flow-card stack border-b border-[#2f2f39] pb-4">
                                            <h3>Competition Activities</h3>
                                            <p className="muted tiny">
                                                These are auto-generated participation activities (codes ending with _PARTICIPATION).
                                            </p>
                                        </article>
                                    )}

                                    <div className="admin-subtabs admin-inner-subtabs" role="tablist" aria-label="Activity management sections">
                                        <button
                                            type="button"
                                            role="tab"
                                            aria-selected={activeActivityManagementTab === 'competitions'}
                                            className={`admin-subtab ${activeActivityManagementTab === 'competitions' ? 'active' : ''}`}
                                            onClick={() => setActiveActivityManagementTab('competitions')}
                                        >
                                            Competitions ({competitionActivities.length})
                                        </button>
                                        <button
                                            type="button"
                                            role="tab"
                                            aria-selected={activeActivityManagementTab === 'activities'}
                                            className={`admin-subtab ${activeActivityManagementTab === 'activities' ? 'active' : ''}`}
                                            onClick={() => setActiveActivityManagementTab('activities')}
                                        >
                                            Activities ({regularActivities.length})
                                        </button>
                                    </div>

                                    <article className="table-wrap table-scroll-y admin-flow-card border-b border-[#2f2f39] pb-4">
                                        <h3>{activeActivityManagementTab === 'competitions' ? 'Competition Activities' : 'Activities'}</h3>
                                        <input
                                            value={activitySearch}
                                            onChange={(event) => setActivitySearch(event.target.value)}
                                            placeholder="Search activities by code, name, type, or description"
                                        />
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Code</th>
                                                    <th>Name</th>
                                                    <th>Type</th>
                                                    <th>Points</th>
                                                    <th>Description</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {displayedActivities.map((item) => (
                                                    <tr key={item.id}>
                                                        <td>{item.code}</td>
                                                        <td>{item.name}</td>
                                                        <td>{item.activityTypeCode}</td>
                                                        <td>{item.points}</td>
                                                        <td>{item.description || '-'}</td>
                                                        <td>{item.isActive ? 'Active' : 'Inactive'}</td>
                                                        <td>
                                                            <div className="actions-row">
                                                                <button type="button" onClick={() => onStartEditActivity(item)}>
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="outline-button"
                                                                    onClick={() => {
                                                                        void onToggleActivityStatus(item)
                                                                    }}
                                                                >
                                                                    {item.isActive ? 'Deactivate' : 'Activate'}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="outline-button"
                                                                    onClick={() => {
                                                                        setReviewActivityId(item.id)
                                                                        setReviewStatusFilter('PENDING')
                                                                        setActiveActivitiesTab('review-submissions')
                                                                    }}
                                                                >
                                                                    Review Submissions
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {!displayedActivities.length ? (
                                                    <tr>
                                                        <td colSpan={7} className="muted">
                                                            {activeActivityManagementTab === 'competitions'
                                                                ? 'No competition activities match this search.'
                                                                : 'No activities match this search.'}
                                                        </td>
                                                    </tr>
                                                ) : null}
                                            </tbody>
                                        </table>
                                    </article>
                                </>
                            ) : null}

                            {activeActivitiesTab === 'review-submissions' ? (
                                <article className="admin-flow-card stack border-b border-[#2f2f39] pb-4">
                                    <h3>Submissions By Activity</h3>
                                    <div className="grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)]">
                                        <section className="min-w-0 border border-[#2f2f39] bg-[#121218]">
                                            <div className="border-b border-[#2f2f39] p-3">
                                                <p className="text-[11px] uppercase tracking-[0.12em] text-[#b8b8c2]">Activity Selector</p>
                                                <input
                                                    value={reviewActivitySearch}
                                                    onChange={(event) => setReviewActivitySearch(event.target.value)}
                                                    placeholder="Search activities by code, name, type, or description"
                                                    className="mt-2"
                                                />
                                            </div>

                                            <div className="grid gap-2 p-2 lg:h-128 lg:overflow-y-auto">
                                                {filteredReviewActivities.map((item) => (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        aria-pressed={reviewActivityId === item.id}
                                                        onClick={() => setReviewActivityId(item.id)}
                                                        className={`relative min-w-0 rounded-md border px-3 py-2.5 text-left transition ${
                                                            reviewActivityId === item.id
                                                                ? 'border-[#ff2a2f] bg-[#231317]'
                                                                : 'border-[#33333d] bg-[#17171d] hover:border-[#ff2a2f]/60'
                                                        }`}
                                                    >
                                                        {reviewActivityId === item.id ? (
                                                            <span className="absolute right-2 top-2 text-[10px] font-bold uppercase tracking-widest text-[#ff7d80]">
                                                                Selected
                                                            </span>
                                                        ) : null}
                                                        <p className="pr-16 text-sm font-semibold leading-snug text-white line-clamp-2">{item.name}</p>
                                                        <p className="mt-1 text-xs leading-snug text-[#b8b8c2] truncate">
                                                            {item.code} | {item.activityTypeCode}
                                                        </p>
                                                    </button>
                                                ))}
                                                {!filteredReviewActivities.length ? (
                                                    <p className="p-2 text-xs text-[#b8b8c2]">No activities match this search.</p>
                                                ) : null}
                                            </div>
                                        </section>

                                        <section className="min-w-0 border border-[#2f2f39] bg-[#121218]">
                                            <div className="flex flex-wrap items-end gap-3 border-b border-[#2f2f39] p-3">
                                                <div className="min-w-64 flex-1">
                                                    <p className="text-[11px] uppercase tracking-[0.12em] text-[#b8b8c2]">Selected Activity</p>
                                                    {selectedReviewActivity ? (
                                                        <p className="mt-1 text-sm text-white">
                                                            <strong>{selectedReviewActivity.name}</strong>
                                                            <br />
                                                            <span className="text-xs text-[#b8b8c2]">
                                                                {selectedReviewActivity.code} ({selectedReviewActivity.activityTypeCode})
                                                            </span>
                                                        </p>
                                                    ) : (
                                                        <p className="mt-1 text-xs text-[#b8b8c2]">Choose an activity from the left column.</p>
                                                    )}
                                                </div>

                                                <div className="min-w-48">
                                                    <label className="tiny muted">Status Filter</label>
                                                    <select
                                                        value={reviewStatusFilter}
                                                        onChange={(event) =>
                                                            setReviewStatusFilter(event.target.value as 'PENDING' | 'APPROVED' | 'REJECTED' | '')
                                                        }
                                                    >
                                                        <option value="">All Statuses</option>
                                                        <option value="PENDING">Pending</option>
                                                        <option value="APPROVED">Approved</option>
                                                        <option value="REJECTED">Rejected</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {!reviewActivityId ? (
                                                <p className="p-3 text-sm text-[#b8b8c2]">Select an activity to review its submissions.</p>
                                            ) : (
                                                <div className="table-wrap lg:h-128 lg:overflow-y-auto">
                                                    <table>
                                                        <thead>
                                                            <tr>
                                                                <th>Participant</th>
                                                                <th>Submission</th>
                                                                <th>Status</th>
                                                                <th>Submitted At</th>
                                                                <th>Review Note</th>
                                                                <th>Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {activitySubmissions.map((submission) => (
                                                                <tr key={submission.id}>
                                                                    <td>
                                                                        <strong>{submission.fullName || submission.participantId}</strong>
                                                                        <div className="tiny muted">{submission.institution || submission.email || '-'}</div>
                                                                    </td>
                                                                    <td>
                                                                        {submission.submissionLink ? (
                                                                            <a href={submission.submissionLink} target="_blank" rel="noreferrer">
                                                                                Open Link
                                                                            </a>
                                                                        ) : (
                                                                            submission.submissionText || '-'
                                                                        )}
                                                                    </td>
                                                                    <td>{submission.status}</td>
                                                                    <td>{new Date(submission.submittedAt).toLocaleString()}</td>
                                                                    <td>
                                                                        <input
                                                                            value={submissionNotes[submission.id] || submission.reviewNote || ''}
                                                                            onChange={(event) =>
                                                                                setSubmissionNotes((prev) => ({ ...prev, [submission.id]: event.target.value }))
                                                                            }
                                                                            placeholder="Review note"
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <div className="actions-row">
                                                                            <button
                                                                                type="button"
                                                                                disabled={submission.status === 'APPROVED'}
                                                                                onClick={() => onApproveSubmission(submission)}
                                                                            >
                                                                                Approve
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                className="outline-button"
                                                                                disabled={submission.status === 'REJECTED'}
                                                                                onClick={() => onRejectSubmission(submission)}
                                                                            >
                                                                                Reject
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {!activitySubmissions.length ? (
                                                                <tr>
                                                                    <td colSpan={6} className="muted">
                                                                        {activitySubmissionsLoading
                                                                            ? 'Loading submissions...'
                                                                            : 'No submissions match this activity and status.'}
                                                                    </td>
                                                                </tr>
                                                            ) : null}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </section>
                                    </div>
                                </article>
                            ) : null}

                            {activeActivitiesTab === 'points-config' ? (
                                <article className="table-wrap table-scroll-y admin-flow-card stack border-b border-[#2f2f39] pb-4">
                                    <h3>Competition Activity Points Configuration</h3>
                                    <p className="muted tiny">
                                        These values are consumed by automated jobs that create and update competition participation activities.
                                    </p>

                                    <form className="actions-row" onSubmit={onUpdateCompetitionDefaultPoints}>
                                        <label style={{ display: 'grid', gap: 6 }}>
                                            Global default points
                                            <input
                                                type="number"
                                                min={0}
                                                max={1000}
                                                value={competitionPointsDefaultInput}
                                                onChange={(event) => setCompetitionPointsDefaultInput(event.target.value)}
                                                required
                                            />
                                        </label>
                                        <button type="submit">Save Default</button>
                                    </form>

                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Competition</th>
                                                <th>Current Override</th>
                                                <th>Set Override</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {competitionList.map((competition) => {
                                                const currentOverride =
                                                    competitionPointsConfig?.overrides.find(
                                                        (item) => item.competitionId === competition.id,
                                                    )?.points ?? null

                                                return (
                                                    <tr key={competition.id}>
                                                        <td>{competition.name}</td>
                                                        <td>{currentOverride === null ? '-' : currentOverride}</td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={1000}
                                                                value={competitionOverrideInputs[competition.id] || ''}
                                                                onChange={(event) =>
                                                                    setCompetitionOverrideInputs((prev) => ({
                                                                        ...prev,
                                                                        [competition.id]: event.target.value,
                                                                    }))
                                                                }
                                                                placeholder="Use default"
                                                            />
                                                        </td>
                                                        <td>
                                                            <div className="actions-row">
                                                                <button
                                                                    type="button"
                                                                    disabled={!competitionOverrideInputs[competition.id]?.trim()}
                                                                    onClick={() => {
                                                                        void onSaveCompetitionOverride(competition.id)
                                                                    }}
                                                                >
                                                                    Save Override
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="outline-button"
                                                                    disabled={currentOverride === null}
                                                                    onClick={() => {
                                                                        void onClearCompetitionOverride(competition.id)
                                                                    }}
                                                                >
                                                                    Clear
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                            {!competitionList.length ? (
                                                <tr>
                                                    <td colSpan={4} className="muted">
                                                        No competitions found.
                                                    </td>
                                                </tr>
                                            ) : null}
                                        </tbody>
                                    </table>
                                </article>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : null}

            {activeTab === 'audit' ? (
                <div className="stack admin-layout-single">
                    <article className="table-wrap table-scroll-y admin-flow-card border-b border-[#2f2f39] pb-4">
                        <h3>Recent Audit Logs</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>When</th>
                                    <th>Action</th>
                                    <th>Target</th>
                                    <th>Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditLogs.map((log) => (
                                    <tr key={log.id}>
                                        <td>{new Date(log.createdAt).toLocaleString()}</td>
                                        <td>{log.actionType}</td>
                                        <td>
                                            {log.targetType || '-'} / {log.targetId || '-'}
                                        </td>
                                        <td>{log.note || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </article>
                </div>
            ) : null}

            {editingActivityId ? (
                <div className="admin-dialog-backdrop" role="presentation">
                    <div className="admin-dialog" role="dialog" aria-live="polite" aria-modal="true">
                        <h3>Edit Activity</h3>
                        <form
                            className="stack"
                            onSubmit={(event) => {
                                event.preventDefault()
                                void onSaveEditActivity()
                            }}
                        >
                            <label className="stack" style={{ gap: 6 }}>
                                <span className="tiny muted">Activity Name</span>
                                <input
                                    value={editActivityName}
                                    onChange={(event) => setEditActivityName(event.target.value)}
                                    placeholder="Activity name"
                                    required
                                />
                            </label>

                            <label className="stack" style={{ gap: 6 }}>
                                <span className="tiny muted">Points</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={1000}
                                    value={editActivityPoints}
                                    onChange={(event) => setEditActivityPoints(event.target.value)}
                                    required
                                />
                            </label>

                            <label className="stack" style={{ gap: 6 }}>
                                <span className="tiny muted">Description</span>
                                <input
                                    value={editActivityDescription}
                                    onChange={(event) => setEditActivityDescription(event.target.value)}
                                    placeholder="Description"
                                />
                            </label>

                            {editingActivity?.activityTypeCode === 'CORRECT_ANSWER' ? (
                                <label className="stack" style={{ gap: 6 }}>
                                    <span className="tiny muted">Correct Answer</span>
                                    <input
                                        value={editActivityCorrectAnswer}
                                        onChange={(event) => setEditActivityCorrectAnswer(event.target.value)}
                                        placeholder="Canonical correct answer"
                                        required
                                    />
                                </label>
                            ) : null}

                            {editActivityError ? <p className="error-banner">{editActivityError}</p> : null}

                            <div className="actions-row" style={{ justifyContent: 'flex-end' }}>
                                <button type="button" className="outline-button" onClick={onCancelEditActivity}>
                                    Cancel
                                </button>
                                <button type="submit">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {dialogState.isOpen ? (
                <div className="admin-dialog-backdrop" role="presentation">
                    <div className="admin-dialog" role="dialog" aria-live="polite" aria-busy={dialogState.status === 'loading'}>
                        <h3>{dialogState.title}</h3>
                        <p className="muted">{dialogState.detail}</p>
                        {dialogState.status === 'loading' ? <div className="admin-spinner" /> : null}
                        {dialogState.status === 'success' ? <p className="status">Action completed successfully.</p> : null}
                        {dialogState.status === 'error' ? <p className="error-banner">Action failed.</p> : null}
                        <button type="button" onClick={closeDialog} disabled={dialogState.status === 'loading'}>
                            {dialogState.status === 'loading' ? 'Processing...' : 'Close'}
                        </button>
                    </div>
                </div>
            ) : null}
        </section>
    )
}
