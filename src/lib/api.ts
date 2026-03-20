import type {
  ActivityKind,
  ActivitySubmission,
  AdminLoginResponse,
  AdminParticipantDetail,
  ActivityType,
  ActivityProgressItem,
  AdjustPointsPayload,
  Competition,
  CompetitionDetail,
  CreateActivityTypePayload,
  LoginResponse,
  MarkCompletionPayload,
  SubmitActivityLinkPayload,
  ParticipantCompetition,
  ParticipantProfile,
  PointsAuditLog,
  PointsLeaderboardResponse,
  PointsSummary,
  RankingsResponse,
  TeamDetail,
} from '../types/api'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000/api/v1'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  accessToken?: string | null
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const body = (await response.json()) as {
        error?: { message?: string }
      }
      if (body.error?.message) {
        message = body.error.message
      }
    } catch {
      // Keep fallback message when backend returns non-JSON body.
    }
    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export const api = {
  login(email: string, password: string) {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    })
  },
  adminLogin(email: string, password: string) {
    return request<AdminLoginResponse>('/auth/admin/login', {
      method: 'POST',
      body: { email, password },
    })
  },
  getMe(accessToken: string) {
    return request<ParticipantProfile>('/participants/me', { accessToken })
  },
  getMyCompetitions(accessToken: string) {
    return request<ParticipantCompetition[]>('/participants/me/competitions', { accessToken })
  },
  getCompetitions(active = true) {
    const params = new URLSearchParams({ active: active ? 'true' : 'false', limit: '100' })
    return request<Competition[]>(`/competitions?${params.toString()}`)
  },
  getCompetitionDetail(competitionId: string) {
    return request<CompetitionDetail>(`/competitions/${competitionId}`)
  },
  getTeamDetail(teamId: string, accessToken: string) {
    return request<TeamDetail>(`/teams/${teamId}`, { accessToken })
  },
  getRankings(limit = 50, offset = 0) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    return request<RankingsResponse>(`/participants/rankings?${params.toString()}`)
  },
  getMyPointsSummary(accessToken: string) {
    return request<PointsSummary>('/points/me/summary', { accessToken })
  },
  getMyActivityProgress(accessToken: string) {
    return request<ActivityProgressItem[]>('/points/me/activities', { accessToken })
  },
  getPointsLeaderboard(limit = 100, offset = 0) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    return request<PointsLeaderboardResponse>(`/points/leaderboard?${params.toString()}`)
  },
  getAdminActivityTypes(accessToken: string, includeInactive = true) {
    const params = new URLSearchParams({ includeInactive: String(includeInactive) })
    return request<ActivityType[]>(`/points/admin/activities?${params.toString()}`, {
      accessToken,
    })
  },
  getAdminActivityKinds(accessToken: string) {
    return request<ActivityKind[]>('/points/admin/activity-kinds', { accessToken })
  },
  createAdminActivityType(accessToken: string, payload: CreateActivityTypePayload) {
    return request<ActivityType>('/points/admin/activities', {
      method: 'POST',
      accessToken,
      body: payload,
    })
  },
  markAdminCompletion(accessToken: string, payload: MarkCompletionPayload) {
    return request('/points/admin/completions', {
      method: 'POST',
      accessToken,
      body: payload,
    })
  },
  adjustAdminPoints(accessToken: string, payload: AdjustPointsPayload) {
    return request('/points/admin/adjustments', {
      method: 'POST',
      accessToken,
      body: payload,
    })
  },
  revokeAdminCompletion(accessToken: string, completionId: string, note?: string) {
    return request(`/points/admin/completions/${completionId}`, {
      method: 'DELETE',
      accessToken,
      body: { note },
    })
  },
  getAdminParticipantDetails(accessToken: string, participantId: string) {
    return request<AdminParticipantDetail>(`/points/admin/participants/${participantId}/details`, {
      accessToken,
    })
  },
  getAdminPendingSubmissions(accessToken: string, participantId?: string) {
    const params = new URLSearchParams({ limit: '30', offset: '0' })
    if (participantId) {
      params.set('participantId', participantId)
    }
    return request<ActivitySubmission[]>(`/points/admin/submissions/pending?${params.toString()}`, {
      accessToken,
    })
  },
  approveAdminSubmission(accessToken: string, submissionId: string, note?: string) {
    return request(`/points/admin/submissions/${submissionId}/approve`, {
      method: 'POST',
      accessToken,
      body: { note },
    })
  },
  rejectAdminSubmission(accessToken: string, submissionId: string, note?: string) {
    return request(`/points/admin/submissions/${submissionId}/reject`, {
      method: 'POST',
      accessToken,
      body: { note },
    })
  },
  submitMyActivityLink(accessToken: string, payload: SubmitActivityLinkPayload) {
    return request('/points/me/submissions', {
      method: 'POST',
      accessToken,
      body: payload,
    })
  },
  getMySubmissions(accessToken: string) {
    return request<ActivitySubmission[]>('/points/me/submissions', { accessToken })
  },
  getAdminAuditLogs(accessToken: string, limit = 20, offset = 0) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    return request<PointsAuditLog[]>(`/points/admin/audit-logs?${params.toString()}`, {
      accessToken,
    })
  },
}
