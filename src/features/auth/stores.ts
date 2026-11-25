import { create } from 'zustand'
import { TERM_ROWS } from './constants'

export { usePhoneAuth } from '../../shared/infrastructure/phone-auth-store'

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
