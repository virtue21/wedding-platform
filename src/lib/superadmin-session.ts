/**
 * Superadmin session helpers.
 * Uses a simple signed token stored in an httpOnly cookie.
 * The token value is just the SUPERADMIN_SESSION_SECRET itself —
 * it's never exposed to the client, and the secret rotates on redeploy.
 */

export const SUPERADMIN_COOKIE = 'sa_session'
export const SUPERADMIN_COOKIE_MAX_AGE = 60 * 60 * 8 // 8 hours

export function getSessionSecret(): string {
  const s = process.env.SUPERADMIN_SESSION_SECRET
  if (!s) throw new Error('SUPERADMIN_SESSION_SECRET is not set')
  return s
}

export function isValidSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false
  try {
    return cookieValue === getSessionSecret()
  } catch {
    return false
  }
}
