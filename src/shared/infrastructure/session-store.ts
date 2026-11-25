import type { Session } from '@push/api-client'
import * as SecureStore from 'expo-secure-store'
import { create } from 'zustand'
import { queryClient } from '@/providers/query-client'
import { runSessionCleared } from '@/shared/utility/session-reset'
import { SESSION_REFRESH_MARGIN_MS, SESSION_STORAGE_KEY } from './constants'

export type StoredSession = Session & { expiresAt?: number }

export const expiresSoon = (session: StoredSession | null | undefined, now = Date.now()) =>
  session?.expiresAt !== undefined && session.expiresAt - SESSION_REFRESH_MARGIN_MS <= now

type SessionState = {
  session: StoredSession | null
  ready: boolean
  load: () => Promise<void>
  set: (s: Session | null) => Promise<void>
}

export const useSession = create<SessionState>((set) => ({
  session: null,
  ready: false,
  load: async () => {
    const raw = await SecureStore.getItemAsync(SESSION_STORAGE_KEY)
    let session: StoredSession | null = null
    if (raw) {
      try {
        session = JSON.parse(raw) as StoredSession
      } catch {
        await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY).catch(() => undefined)
      }
    }
    set({ session, ready: true })
  },
  set: async (next) => {
    const session = next && next.expiresIn > 0 ? { ...next, expiresAt: Date.now() + next.expiresIn * 1000 } : next
    const hadSession = useSession.getState().session != null
    if (session) await SecureStore.setItemAsync(SESSION_STORAGE_KEY, JSON.stringify(session))
    else await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY)
    if (hadSession && session === null) {
      await queryClient.cancelQueries()
      queryClient.clear()
      runSessionCleared()
    }
    set({ session })
  },
}))
