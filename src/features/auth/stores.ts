import type { Session } from '@push/api-client'
import { create } from 'zustand'

type Mode = 'social' | 'phone'

type PhoneDraft = {
  mode: Mode
  pendingToken: string | null
  email: string | null
  digits: string
  cooldownEndsAt: number | null
  providers: string[]
  held: Session | null
  beginSocial: (pendingToken: string, email: string | null) => void
  beginPhone: () => void
  setDigits: (digits: string) => void
  setCooldown: (endsAt: number) => void
  setProviders: (providers: string[]) => void
  hold: (session: Session) => void
  clear: () => void
}

const blank = {
  mode: 'phone' as Mode,
  pendingToken: null,
  email: null,
  digits: '',
  cooldownEndsAt: null,
  providers: [] as string[],
  held: null as Session | null,
}

export const usePhoneAuth = create<PhoneDraft>((set) => ({
  ...blank,
  beginSocial: (pendingToken, email) => set({ ...blank, mode: 'social', pendingToken, email }),
  beginPhone: () => set({ ...blank, mode: 'phone' }),
  setDigits: (digits) => set({ digits }),
  setCooldown: (cooldownEndsAt) => set({ cooldownEndsAt }),
  setProviders: (providers) => set({ providers }),
  hold: (held) => set({ held }),
  clear: () => set(blank),
}))
