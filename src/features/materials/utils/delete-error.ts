import { ApiError } from '@push/api-client'

export const isCitedError = (error: unknown) => error instanceof ApiError && error.status === 409
