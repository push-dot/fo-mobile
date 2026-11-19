import { ApiError } from '@push/api-client'
import { QueryClient } from '@tanstack/react-query'

/** A 4xx answer will not change on retry, so it shows at once; anything else retries twice. */
export const shouldRetry = (failureCount: number, error: unknown) =>
  !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2

export const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: shouldRetry } } })
