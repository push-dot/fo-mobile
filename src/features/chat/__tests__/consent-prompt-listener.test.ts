import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { StateCreator } from 'zustand'

const pushed = vi.hoisted(() => vi.fn())
const shown = vi.hoisted(() => vi.fn())
const effects = vi.hoisted(() => new Map<string, unknown[]>())
const refs = vi.hoisted(() => ({ current: undefined as { current: unknown } | undefined }))
const nav = vi.hoisted(() => ({ focused: false }))
const qc = vi.hoisted(() => ({}))

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  useEffect: (fn: () => void, deps: unknown[]) => {
    const prev = effects.get(String(fn))
    if (prev && deps.every((d, i) => Object.is(d, prev[i]))) return
    effects.set(String(fn), deps)
    fn()
  },
  useRef: (initial: unknown) => (refs.current ??= { current: initial }),
}))
vi.mock('zustand', async () => {
  const { createStore } = await import('zustand/vanilla')
  const bound = <T,>(init: StateCreator<T>) => {
    const api = createStore<T>()(init)
    return Object.assign(<U,>(pick: (s: T) => U) => pick(api.getState()), api)
  }
  return { create: bound }
})
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQueryClient: () => qc,
}))
vi.mock('react-native', () => ({ Alert: { alert: vi.fn() } }))
vi.mock('@/features/my', () => ({ grantReferenceAccess: vi.fn(), useReferenceConsent: () => ({ data: { referenceData: false } }) }))
vi.mock('@/shared/navigation', () => ({ showConsentModal: shown }))

vi.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => pushed(...args) },
  useIsFocused: () => nav.focused,
}))
vi.mock('@/shared/infrastructure', () => ({
  api: {},
  http: {},
  API_MOCK: true,
  hapticImpactLight: vi.fn(),
  hapticNotify: vi.fn(),
}))
vi.mock('@/shared/infrastructure/sources', () => ({ sourcesApi: { upload: vi.fn() } }))
vi.mock('../api/fetchers', () => ({
  chatApi: {},
}))

const { askConsent, useConsentPrompt } = await import('../stores')
const { ConsentPromptListener } = await import('../components/consent-prompt-listener')
const { ConsentSheet } = await import('../components/consent-sheet')

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
  shown.mockClear()
  effects.clear()
  refs.current = undefined
  nav.focused = false
  useConsentPrompt.setState({ open: false })
})

describe('ConsentPromptListener', () => {
  it('opens the consent sheet through its store, never by pushing a route, and the stack registers the sheet route', () => {
    expect(listenerSource).toContain('showConsentModal(')
    expect(listenerSource).not.toContain('router')
    expect(stackLayoutSource).toContain('name="consent"')
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
    expect(storesSource).toContain("@/shared/infrastructure/sources")
    expect(fetchersSource).toContain("@/shared/infrastructure/sources")
  })

  it('opens the consent sheet again after the user dismissed it', () => {
    askConsent()
    ConsentPromptListener()
    expect(shown).toHaveBeenCalledOnce()

    shown.mock.calls[0]?.[1].onDismiss()
    ConsentPromptListener()
    askConsent()
    ConsentPromptListener()

    expect(shown).toHaveBeenCalledTimes(2)
  })
  it('keeps a dismissed sheet closed when the chat refocuses, and asks again on the next visit', () => {
    const render = () => (ConsentSheet({ kind: 'push' }), ConsentPromptListener())
    nav.focused = true
    render()
    expect(shown).toHaveBeenCalledOnce()

    nav.focused = false
    render()
    shown.mock.calls[0]?.[1].onDismiss()
    render()
    nav.focused = true
    render()
    expect(shown).toHaveBeenCalledOnce()

    effects.clear()
    refs.current = undefined
    render()
    expect(shown).toHaveBeenCalledTimes(2)
  })
})
