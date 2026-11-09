import { createApi, createClient } from '@push/api-client'
import { fetch as expoFetch } from 'expo/fetch'
import * as Crypto from 'expo-crypto'
import { API_BASE_URL } from './config'
import { useSession } from './session-store'

// The flag is read inline, not from config, so Metro folds it and production bundles leave the mock out.
const MOCK = process.env.EXPO_PUBLIC_API_MOCK === '1'
/* eslint-disable @typescript-eslint/no-require-imports */
const mockFetch: typeof fetch | undefined = MOCK ? require('../../mock').mockFetch : undefined
if (MOCK) require('../../mock/links').listenMockLinks()
/* eslint-enable @typescript-eslint/no-require-imports */

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
  fetch: mockFetch ?? (expoFetch as unknown as typeof fetch),
  uuid: () => Crypto.randomUUID(),
})

export const api = createApi(http)
