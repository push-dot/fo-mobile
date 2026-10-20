import { absoluteUrl } from '@push/api-client'

// Android emulator reaches the host via 10.0.2.2; set these in .env.local per device.
// Default is the deployed gateway; point at a local push-be with EXPO_PUBLIC_API_BASE_URL.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://push-be.youngjoon568.workers.dev/api/v1'
export const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_BASE_URL ?? 'http://localhost:5174'
/** push-be image URLs are server-relative ("/api/v1/uploads/images/…"); native Image needs them absolute. */
export const assetUrl = (url: string | null | undefined) => absoluteUrl(url, API_BASE_URL) ?? undefined
export const DEV_AUTH_TOKEN = process.env.EXPO_PUBLIC_DEV_AUTH_TOKEN
// Serve fixtures from src/mock until push-be v2 endpoints exist.
export const API_MOCK = process.env.EXPO_PUBLIC_API_MOCK === '1'
