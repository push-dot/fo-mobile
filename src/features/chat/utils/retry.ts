import { ApiError } from '@push/api-client'

const MAX_RETRIES = 3

/** react-query `retry`: a missing row stays missing, so a 404 fails at once instead of retrying. */
export const retryUnlessMissing = (failures: number, error: unknown) => !(error instanceof ApiError && error.status === 404) && failures < MAX_RETRIES
