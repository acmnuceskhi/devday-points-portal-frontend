import type {
  ApiErrorResponse,
  AdminLoginResponse,
  Competition,
  CompetitionDetail,
  LoginResponse,
  SignupRequestResponse,
  SignupVerifyResponse,
  ParticipantCompetition,
  ParticipantProfile,
  TeamDetail,
} from '../types/api'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000/api/v1'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  accessToken?: string | null
}

export const SESSION_EXPIRED_EVENT = 'devday:session-expired'

export type SessionScope = 'participant' | 'admin'

export type SessionExpiredDetail = {
  scope: SessionScope
  status: number
  code: string | null
}

function resolveSessionScope(path: string): SessionScope {
  if (path.startsWith('/auth/admin') || path.includes('/points/admin')) {
    return 'admin'
  }

  return 'participant'
}

function emitSessionExpired(detail: SessionExpiredDetail) {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new CustomEvent<SessionExpiredDetail>(SESSION_EXPIRED_EVENT, { detail }))
}

type AdminSubmissionReviewResponse = {
  submissionId: string
  decision: 'APPROVED' | 'REJECTED'
  noOp?: boolean
  previousStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
  completionReversed?: boolean
  pointsRemoved?: number
}

export class ApiRequestError extends Error {
  code: string | null
  status: number | null
  details: unknown

  constructor(message: string, options: { code?: string | null; status?: number | null; details?: unknown } = {}) {
    super(message)
    this.name = 'ApiRequestError'
    this.code = options.code ?? null
    this.status = options.status ?? null
    this.details = options.details
  }
}

function getPublicErrorMessage(status: number): string {
  if (status === 400) return 'Request could not be processed. Please check your input and try again.'
  if (status === 401) return 'Authentication failed. Please check your credentials and try again.'
  if (status === 403) return 'You do not have permission to perform this action.'
  if (status === 404) return 'The requested resource was not found.'
  if (status === 409) return 'This action could not be completed due to a conflict.'
  if (status === 422) return 'Some fields are invalid. Please review and try again.'
  if (status === 429) return 'Too many requests. Please wait a moment and try again.'
  if (status >= 500) return 'Something went wrong on the server. Please try again later.'
  return 'Request failed. Please try again.'
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
    const message = getPublicErrorMessage(response.status)
    let code: string | null = null
    let details: unknown = null
    try {
      const body = (await response.json()) as ApiErrorResponse
      code = body.error?.code ?? null
      details = body.error?.details ?? null
    } catch {
      // Keep fallback message when backend returns non-JSON body.
    }

    if (response.status === 401 && options.accessToken) {
      emitSessionExpired({
        scope: resolveSessionScope(path),
        status: response.status,
        code,
      })
    }

    throw new ApiRequestError(message, { code, status: response.status, details })
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
  signupRequest(email: string, fullName: string) {
    return request<SignupRequestResponse>('/auth/signup/request', {
      method: 'POST',
      body: { email, fullName },
    })
  },
  signupVerify(email: string, token: string, password: string, confirmPassword: string) {
    return request<SignupVerifyResponse>('/auth/signup/verify', {
      method: 'POST',
      body: { email, token, password, confirmPassword },
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
  // Points/activity/rankings/admin-points APIs are intentionally disabled in the active build.
  // The preserved implementation remains in `src/lib/api.legacy.ts` for future restoration.
  // getRankings(limit = 50, offset = 0) {
  //   const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  //   return request<RankingsResponse>(`/participants/rankings?${params.toString()}`)
  // },
  // getMyPointsSummary(accessToken: string) {
  //   return request<PointsSummary>('/points/me/summary', { accessToken })
  // },
  // getMyActivityProgress(accessToken: string) {
  //   return request<ActivityProgressItem[]>('/points/me/activities', { accessToken })
  // },
  // getPointsLeaderboard(limit = 100, offset = 0) {
  //   const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  //   return request<PointsLeaderboardResponse>(`/points/leaderboard?${params.toString()}`)
  // },
  // ... all admin points/activity methods migrated to `api.legacy.ts`.
}
