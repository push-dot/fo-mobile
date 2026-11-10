import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const pushed = vi.hoisted(() => vi.fn())

vi.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => pushed(...args) },
  useIsFocused: () => false,
}))
vi.mock('@/shared/infrastructure', () => ({
  api: {},
  http: {},
  API_MOCK: true,
  hapticImpactLight: vi.fn(),
  hapticNotify: vi.fn(),
}))
vi.mock('@/features/my', () => ({ myApi: { upload: vi.fn() } }))
vi.mock('../api/fetchers', () => ({
  chatApi: {},
  createConversation: vi.fn(),
  fetchConversationMessages: vi.fn(),
  fetchConversationTurns: vi.fn(),
  followConversation: vi.fn(),
  resolveConversationApproval: vi.fn(),
  streamConversation: vi.fn(),
  updateAiAccessMode: vi.fn(),
}))

const { askConsent, useConsentPrompt } = await import('../stores')
const { routeConsentWhenOpen } = await import('../components/consent-prompt-listener')

const chatTabSource = readFileSync(
  new URL('../../../app/(app)/(stack)/(tabs)/(chat)/chat.tsx', import.meta.url),
  'utf8',
)
const listenerSource = readFileSync(new URL('../components/consent-prompt-listener.tsx', import.meta.url), 'utf8')

beforeEach(() => {
  pushed.mockClear()
  useConsentPrompt.setState({ open: false, dismissed: false })
})

describe('ConsentPromptListener', () => {
  it('pushes the consent route when askConsent(true) fires while the chat tab stays unfocused', () => {
    askConsent(true)
    routeConsentWhenOpen(useConsentPrompt.getState().open)
    expect(pushed).toHaveBeenCalledWith('/consent')
  })

  it('does not read consents or settings on cold start', () => {
    expect(chatTabSource).toContain('useFocusedOnce() ? <ChatHomeScreen /> : null')
    expect(listenerSource).not.toContain('useReferenceConsent')
    expect(listenerSource).not.toContain('useMySettings')
    expect(pushed).not.toHaveBeenCalled()
  })
})
