import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../lib/api'
import {
  clearStoredAdminAccessToken,
  getStoredAdminAccessToken,
  setStoredAdminAccessToken,
} from '../lib/storage'
import type { StaffProfile, UserSummary } from '../types/api'

type AdminAuthContextValue = {
  isAuthenticated: boolean
  accessToken: string | null
  user: UserSummary | null
  staffProfile: StaffProfile | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(getStoredAdminAccessToken())
  const [user, setUser] = useState<UserSummary | null>(null)
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null)

  const login = async (email: string, password: string) => {
    const result = await api.adminLogin(email, password)
    setStoredAdminAccessToken(result.accessToken)
    setAccessToken(result.accessToken)
    setUser(result.user)
    setStaffProfile(result.staffProfile)
  }

  const logout = () => {
    clearStoredAdminAccessToken()
    setAccessToken(null)
    setUser(null)
    setStaffProfile(null)
  }

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      isAuthenticated: Boolean(accessToken),
      accessToken,
      user,
      staffProfile,
      login,
      logout,
    }),
    [accessToken, staffProfile, user],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used inside AdminAuthProvider')
  }
  return context
}
