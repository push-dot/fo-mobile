import { ApiError } from '@push/api-client'

export const isConsentRequired = (err: unknown) =>
  err instanceof ApiError && err.status === 403 && err.code === 'CONSENT_REQUIRED'
