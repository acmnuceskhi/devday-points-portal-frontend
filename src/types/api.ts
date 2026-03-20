export type ApiErrorResponse = {
  error?: {
    message?: string
    details?: unknown
  }
}

export type UserSummary = {
  id: string
  email: string
  type: string
}

export type ParticipantProfile = {
  id: string
  userId: string
  cnic: string | null
  email: string | null
  fullName: string
  phone: string | null
  institution: string | null
  rollNumber: string | null
  createdAt: string
  updatedAt: string
}

export type LoginResponse = {
  accessToken: string
  user: UserSummary
  participant: ParticipantProfile
}

export type StaffProfile = {
  id: string
  fullName: string
  nuId: string
  isApproved: boolean
  staffRole: string
  assignedBooth: string | null
}

export type AdminLoginResponse = {
  accessToken: string
  user: UserSummary
  staffProfile: StaffProfile
}

export type ParticipantCompetition = {
  teamId: string
  isLeader: boolean
  joinedAt: string
  competitionId: string
  teamName: string
  paymentStatus: string
  competitionName: string
  compDay: string
  startTime: string
  endTime: string
  venueId: string | null
  venueName: string | null
}

export type Competition = {
  id: string
  name: string
  description: string | null
  fee: number | null
  minTeamSize: number | null
  maxTeamSize: number | null
  capacityLimit: number | null
  compDay: string
  startTime: string | null
  endTime: string | null
  isActive: boolean
  registrationDeadline: string | null
  earlyBirdFee: number | null
  earlyBirdLimit: number | null
  totalSeats: number | null
  availableSeats: number
}

export type Venue = {
  id: string
  name: string
  location: string | null
  capacity: number | null
  facilities: string | null
}

export type CompetitionDetail = Competition & {
  venues: Venue[]
}

export type TeamMember = {
  id: string
  participantId: string
  isLeader: boolean
  joinedAt: string
  fullName: string | null
  institution: string | null
  email: string | null
}

export type TeamDetail = {
  id: string
  name: string
  competitionId: string
  referenceId: string | null
  paymentStatus: string
  paymentProofUrl: string | null
  paymentMethod: string | null
  paymentDate: string | null
  declaredTID: string | null
  amountPaid: number | null
  isEarlyBird: boolean
  competitionName: string | null
  members: TeamMember[]
}

export type RankingItem = {
  participantId: string
  fullName: string
  institution: string | null
  teamMemberships: number
  competitionsJoined: number
}

export type RankingsResponse = {
  type: 'participation-ranking'
  items: RankingItem[]
}

export type PointsSummary = {
  participantId: string
  totalPoints: number
  updatedAt: string | null
}

export type ActivityProgressItem = {
  id: string
  code: string
  name: string
  description: string | null
  points: number
  isActive: boolean
  activityTypeCode: 'MANUAL' | 'LINK_BASED' | string
  completionId: string | null
  completedAt: string | null
  note: string | null
  approvedSubmissionLink: string | null
  isCompleted: boolean
  submissionId: string | null
  submissionStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null
  submittedLink: string | null
  submittedAt: string | null
}

export type PointsLeaderboardItem = {
  participantId: string
  fullName: string
  institution: string | null
  totalPoints: number
}

export type PointsLeaderboardResponse = {
  type: 'points-leaderboard'
  items: PointsLeaderboardItem[]
}

export type ActivityType = {
  id: string
  code: string
  name: string
  description: string | null
  points: number
  activityTypeId: string
  activityTypeCode: string
  activityTypeName: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type ActivityKind = {
  id: string
  code: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type CreateActivityTypePayload = {
  code: string
  name: string
  description?: string
  points: number
  activityTypeId: string
  isActive?: boolean
}

export type MarkCompletionPayload = {
  participantId: string
  activityId: string
  note?: string
}

export type SubmitActivityLinkPayload = {
  activityId: string
  submissionLink: string
}

export type AdjustPointsPayload = {
  participantId: string
  pointsDelta: number
  reason?: string
}

export type PointsAuditLog = {
  id: string
  actorStaffProfileId: string
  actionType: string
  targetType: string | null
  targetId: string | null
  note: string | null
  payload: unknown
  createdAt: string
}

export type ActivitySubmission = {
  id: string
  participantId: string
  fullName?: string
  institution?: string | null
  email?: string | null
  phone?: string | null
  activityId: string
  activityName: string
  points: number
  submissionLink: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  submittedAt: string
  reviewedAt?: string | null
  reviewNote?: string | null
}

export type CompletionItem = {
  id: string
  activityId: string
  activityName: string
  activityCode: string
  points: number
  completedAt: string
  note: string | null
  submissionLink: string | null
}

export type LedgerEntry = {
  id: string
  entryType: string
  pointsDelta: number
  metadata: unknown
  createdAt: string
}

export type AdminParticipantDetail = {
  participant: {
    participantId: string
    fullName: string
    institution: string | null
    email: string | null
    phone: string | null
  }
  summary: PointsSummary
  completions: CompletionItem[]
  pendingSubmissions: ActivitySubmission[]
  ledger: LedgerEntry[]
}