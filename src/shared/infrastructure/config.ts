export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://push-be.youngjoon568.workers.dev/api/v1'

/** The deployed fo-web (Cloudflare Workers), used when a release build has no EXPO_PUBLIC_WEB_BASE_URL. */
export const PRODUCTION_WEB_URL = 'https://push-fo-web.youngjoon568.workers.dev'

/** A dev build falls back to the local fo-web dev server; a release build never points at localhost. */
export const webBaseUrl = (env: string | undefined, dev: boolean) => env || (dev ? 'http://localhost:5174' : PRODUCTION_WEB_URL)

export const WEB_BASE_URL = webBaseUrl(process.env.EXPO_PUBLIC_WEB_BASE_URL, typeof __DEV__ !== 'undefined' && __DEV__)
export const DEV_AUTH_TOKEN = process.env.NODE_ENV === 'production' ? undefined : process.env.EXPO_PUBLIC_DEV_AUTH_TOKEN
export const API_MOCK = process.env.EXPO_PUBLIC_API_MOCK === '1'
