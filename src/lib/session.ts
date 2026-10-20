import * as SecureStore from 'expo-secure-store'
import { create } from 'zustand'
import type { Session } from '@push/api-client'

const KEY = 'push-session'

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
    const raw = await SecureStore.getItemAsync(KEY)
    set({ session: raw ? (JSON.parse(raw) as Session) : null, ready: true })
  },
  set: async (session) => {
    if (session) await SecureStore.setItemAsync(KEY, JSON.stringify(session))
    else await SecureStore.deleteItemAsync(KEY)
    set({ session })
  },
}))
