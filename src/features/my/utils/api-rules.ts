import { ApiError } from '@push/api-client'

export { isJobSettled, stageBadge, workConditionLines } from '@push/api-client'

export const needsReauth = (error: unknown) => error instanceof ApiError && error.code === 'REAUTH_REQUIRED'
