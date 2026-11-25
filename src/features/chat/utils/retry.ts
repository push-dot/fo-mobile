import { ApiError } from '@push/api-client'

const MAX_RETRIES = 3

export const retryUnlessMissing = (failures: number, error: unknown) => !(error instanceof ApiError && error.status === 404) && failures < MAX_RETRIES
