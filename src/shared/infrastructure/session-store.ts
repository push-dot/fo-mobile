import type { Session } from '@push/api-client'
import * as SecureStore from 'expo-secure-store'
import { create } from 'zustand'
import { queryClient } from '@/providers/query-client'
import { SESSION_STORAGE_KEY } from './constants'

type SessionState = {
  session: Session | null
  ready: boolean
  load: () => Promise<void>
  set: (s: Session | null) => Promise<void>
}

export const useSession = create<SessionState>((set) => ({
  session: null,
  ready: false,
  load: async () => {
    const raw = await SecureStore.getItemAsync(SESSION_STORAGE_KEY)
    set({ session: raw ? (JSON.parse(raw) as Session) : null, ready: true })
  },
  set: async (session) => {
    const hadSession = useSession.getState().session != null
    if (session) await SecureStore.setItemAsync(SESSION_STORAGE_KEY, JSON.stringify(session))
    else await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY)
    if (hadSession && session === null) {
      await queryClient.cancelQueries()
      queryClient.clear()
    }
    set({ session })
  },
}))
