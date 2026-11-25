import { ApiError } from '@push/api-client'
import { QueryClient } from '@tanstack/react-query'

export const shouldRetry = (failureCount: number, error: unknown) =>
  !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2

export const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, gcTime: 30 * 60_000, retry: shouldRetry } } })
