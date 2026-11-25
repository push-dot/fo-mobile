export const isAppleCancel = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === 'ERR_REQUEST_CANCELED'
