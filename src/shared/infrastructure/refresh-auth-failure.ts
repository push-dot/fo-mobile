import { ApiError } from '@push/api-client'

const INVALID_REFRESH_CODES = new Set(['TOKEN_EXPIRED', 'UNAUTHENTICATED', 'INVALID_TOKEN', 'INVALID_REFRESH_TOKEN'])

/** True when the refresh endpoint rejected the stored session; transient failures stay false. */
export const isRefreshAuthFailure = (error: unknown): boolean => {
  if (!(error instanceof ApiError)) return false
  if (error.status === 401 || error.status === 403) return true
  return INVALID_REFRESH_CODES.has(error.code)
}
