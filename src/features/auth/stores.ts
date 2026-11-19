import type { Session } from '@push/api-client'
import { create } from 'zustand'
import { TERM_ROWS } from './constants'
import type { LoginProvider } from './utils'

type Mode = 'social' | 'phone'

type PhoneDraft = {
  mode: Mode
  pendingToken: string | null
  email: string | null
  provider: LoginProvider | null
  digits: string
  cooldownEndsAt: number | null
  held: Session | null
  beginSocial: (pendingToken: string, email: string | null, provider: LoginProvider) => void
  beginPhone: () => void
  setDigits: (digits: string) => void
  setCooldown: (endsAt: number) => void
  hold: (session: Session) => void
  clear: () => void
}

const blank = {
  mode: 'phone' as Mode,
  pendingToken: null,
  email: null,
  provider: null as LoginProvider | null,
  digits: '',
  cooldownEndsAt: null,
  held: null as Session | null,
}

export const usePhoneAuth = create<PhoneDraft>((set) => ({
  ...blank,
  beginSocial: (pendingToken, email, provider) => set({ ...blank, mode: 'social', pendingToken, email, provider }),
  beginPhone: () => set({ ...blank, mode: 'phone' }),
  // A code was sent to the old number only: a different number has none, so the code screen stays closed until one is sent.
  setDigits: (digits) => set((s) => (digits === s.digits ? s : { digits, cooldownEndsAt: null })),
  setCooldown: (cooldownEndsAt) => set({ cooldownEndsAt }),
  hold: (held) => set({ held }),
  clear: () => set(blank),
}))

type TermsConsent = {
  checked: Record<string, boolean>
  toggle: (id: string) => void
  toggleAll: () => void
  agree: (id: string) => void
  reset: () => void
}

const unchecked = () => Object.fromEntries(TERM_ROWS.map((row) => [row.id, false]))

export const useTermsConsent = create<TermsConsent>((set) => ({
  checked: unchecked(),
  toggle: (id) => set((s) => ({ checked: { ...s.checked, [id]: !s.checked[id] } })),
  toggleAll: () => set((s) => ({ checked: Object.fromEntries(TERM_ROWS.map((row) => [row.id, !TERM_ROWS.every((r) => s.checked[r.id])])) })),
  agree: (id) => set((s) => ({ checked: { ...s.checked, [id]: true } })),
  reset: () => set({ checked: unchecked() }),
}))
