const ACCESS_TOKEN_KEY = 'devday.portal.accessToken'
const ADMIN_ACCESS_TOKEN_KEY = 'devday.portal.adminAccessToken'

export function getStoredAccessToken() {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setStoredAccessToken(token: string) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function clearStoredAccessToken() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
}

export function getStoredAdminAccessToken() {
  return window.localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY)
}

export function setStoredAdminAccessToken(token: string) {
  window.localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, token)
}

export function clearStoredAdminAccessToken() {
  window.localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY)
}
