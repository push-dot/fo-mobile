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
vi.mock('@/features/my/api/fetchers', () => ({ myApi: { upload: vi.fn() } }))
vi.mock('../api/fetchers', () => ({
  chatApi: {},
  createConversation: vi.fn(),
  fetchConversationMessages: vi.fn(),
  fetchConversationTurns: vi.fn(),
  followConversation: vi.fn(),
  resolveConversationApproval: vi.fn(),
  streamConversation: vi.fn(),
}))

const { useConsentPrompt } = await import('../stores')

const chatTabSource = readFileSync(
  new URL('../../../app/(app)/(stack)/(tabs)/(bots)/bots.tsx', import.meta.url),
  'utf8',
)
const stackLayoutSource = readFileSync(
  new URL('../../../app/(app)/(stack)/_layout.tsx', import.meta.url),
  'utf8',
)
const storesSource = readFileSync(new URL('../stores.ts', import.meta.url), 'utf8')
const fetchersSource = readFileSync(new URL('../api/fetchers.ts', import.meta.url), 'utf8')
const listenerSource = readFileSync(new URL('../components/consent-prompt-listener.tsx', import.meta.url), 'utf8')

beforeEach(() => {
  pushed.mockClear()
  useConsentPrompt.setState({ open: false, dismissed: false })
})

describe('ConsentPromptListener', () => {
  it('opens the choice modal, not its own route, when the prompt opens while the chat tab stays unfocused', () => {
    expect(listenerSource).toContain('showConsentModal(')
    expect(listenerSource).not.toContain('router')
    expect(stackLayoutSource).not.toContain('name="consent"')
  })

  it('does not read consents or settings on cold start', () => {
    expect(chatTabSource).toContain('import(')
    expect(listenerSource).not.toContain('useReferenceConsent')
    expect(listenerSource).not.toContain('useMySettings')
    expect(pushed).not.toHaveBeenCalled()
  })

  it('imports chat through its index and keeps my off the chat startup path', () => {
    expect(stackLayoutSource).toMatch(/from ['"]@\/features\/chat['"]/)
    expect(stackLayoutSource).not.toMatch(/from ['"]@\/features\/chat\//)
    expect(storesSource).not.toMatch(/from ['"]@\/features\/my['"]/)
    expect(fetchersSource).not.toMatch(/from ['"]@\/features\/my['"]/)
    expect(storesSource).toContain("@/features/my/api/fetchers")
    expect(fetchersSource).toContain("@/features/my/types")
  })
})
