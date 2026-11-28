import { ApiError } from '@push/api-client'
import { CONTACT_CODE_EXPIRED, CONTACT_CODE_INVALID, CONTACT_TRY_AGAIN, contactCooldown } from '../constants'

export { contactMissing, contactRequired } from '@push/api-client'

export const contactFailureLine = (error: unknown) => {
  if (!(error instanceof ApiError)) return CONTACT_TRY_AGAIN
  if (error.code === 'PHONE_CODE_INVALID' || error.code === 'EMAIL_CODE_INVALID') return CONTACT_CODE_INVALID
  if (error.code === 'PHONE_CODE_EXPIRED' || error.code === 'EMAIL_CODE_EXPIRED') return CONTACT_CODE_EXPIRED
  const wait = Number(error.details?.retryAfterSec)
  if (error.code === 'RATE_LIMITED' && Number.isFinite(wait) && wait > 0) return contactCooldown(wait)
  return CONTACT_TRY_AGAIN
}

export const canMoveDocuments = (error: unknown) =>
  error instanceof ApiError && error.code === 'PHONE_TAKEN' && error.details?.canMoveDocuments === true
