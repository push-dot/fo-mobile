import { createApi, createClient } from '@push/api-client'
import { fetch as expoFetch } from 'expo/fetch'
import * as Crypto from 'expo-crypto'
import { mockFetch } from '../../mock'
import { API_BASE_URL, API_MOCK } from './config'
import { useSession } from './session-store'

let refreshing: Promise<boolean> | null = null

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

export const http = createClient({
  baseUrl: API_BASE_URL,
  getToken: () => useSession.getState().session?.accessToken,
  refresh,
  fetch: API_MOCK ? mockFetch : (expoFetch as unknown as typeof fetch),
  uuid: () => Crypto.randomUUID(),
})

export const api = createApi(http)
