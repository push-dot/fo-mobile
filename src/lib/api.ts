import { fetch as expoFetch } from 'expo/fetch'
import * as Crypto from 'expo-crypto'
import { createApi, createClient } from '@push/api-client'
import { API_BASE_URL, API_MOCK } from './config'
import { mockFetch } from '../mock'
import { useSession } from './session'

let refreshing: Promise<boolean> | null = null

// Single-flight refresh: concurrent 401s share one refresh call.
const refresh = () => {
  refreshing ??= (async () => {
    const { session, set } = useSession.getState()
    if (!session?.refreshToken) return false
    try {
      await set(await api.auth.refresh(session.refreshToken))
      return true
    } catch {
      await set(null)
      return false
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

/** Shared ky-based client; screens with endpoints not yet in @push/api-client call it directly. */
export const http = createClient({
  baseUrl: API_BASE_URL,
  getToken: () => useSession.getState().session?.accessToken,
  refresh,
  // expo/fetch exposes a ReadableStream body, needed for chat SSE.
  fetch: API_MOCK ? mockFetch : (expoFetch as unknown as typeof fetch),
  uuid: () => Crypto.randomUUID(),
})

export const api = createApi(http)
