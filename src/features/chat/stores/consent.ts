import { create } from 'zustand'
import type { ChatIntent } from '@push/api-client'
import type { PickedFile } from '@/features/my/types'
import type { RunInput } from '../api/schemas'

export const useConsentPrompt = create<{ open: boolean; dismissed: boolean }>(() => ({ open: false, dismissed: false }))

export type PendingOpen = { title: string; message: string; attachment?: string | PickedFile; intent?: ChatIntent; context?: RunInput['context'] }

export const pendingConsent = new Map<string, RunInput>()
let pendingOpen: PendingOpen | null = null
let pendingRetry: (() => void) | null = null
let openChat: ((p: PendingOpen) => void) | null = null

export const askConsent = (force = false) => {
  const s = useConsentPrompt.getState()
  if (!(force || !s.dismissed) || s.open) return
  useConsentPrompt.setState({ open: true })
}

export const askConsentThen = (retry: () => void) => {
  pendingRetry = retry
  askConsent(true)
}

export const holdOpen = (p: PendingOpen) => {
  pendingOpen = p
}

export const bindOpenChat = (fn: (p: PendingOpen) => void) => {
  openChat = fn
}

export const laterConsent = () => {
  pendingConsent.clear()
  pendingOpen = null
  pendingRetry = null
  useConsentPrompt.setState({ open: false, dismissed: true })
}

export const consentTurnedOff = () => useConsentPrompt.setState({ dismissed: false, open: false })

export const takeConsent = () => {
  useConsentPrompt.setState({ open: false, dismissed: true })
  const held = [...pendingConsent.values()]
  pendingConsent.clear()
  const open = pendingOpen
  pendingOpen = null
  const retry = pendingRetry
  pendingRetry = null
  return { held, open, retry, openChat }
}

export const resetConsent = () => {
  pendingConsent.clear()
  pendingOpen = null
  pendingRetry = null
  useConsentPrompt.setState({ open: false, dismissed: false })
}
