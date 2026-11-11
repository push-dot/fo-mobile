export type ErrorBoundaryUiState = 'ok' | 'error'

export const reduceError = (state: ErrorBoundaryUiState, event: 'error' | 'retry'): ErrorBoundaryUiState => {
  if (event === 'error') return 'error'
  return 'ok'
}
