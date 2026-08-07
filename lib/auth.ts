export const AUTH_ALLOWLIST_ENV = 'ALLOWED_LOGIN_EMAILS'

export function getAllowedLoginEmails() {
  return (process.env[AUTH_ALLOWLIST_ENV] ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function isEmailAllowed(email?: string | null) {
  const allowedEmails = getAllowedLoginEmails()

  if (allowedEmails.length === 0) {
    return false
  }

  return Boolean(email && allowedEmails.includes(email.toLowerCase()))
}
