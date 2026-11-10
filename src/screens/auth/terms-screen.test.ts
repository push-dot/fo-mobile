import type { Session } from '@push/api-client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => ({
  held: null as Session | null,
  clear: vi.fn(),
  reset: vi.fn(),
  focused: true,
  unmount: [] as (() => void)[],
}))

const heldSession = {
  accessToken: 'at',
  refreshToken: 'rt',
  expiresIn: 3600,
  user: { id: 'u1', displayName: '김서준', locale: 'ko' },
} satisfies Session

vi.mock('react', async (orig) => {
  const actual = await orig<typeof import('react')>()
  return {
    ...actual,
    useEffect: (effect: () => void | (() => void)) => {
      const cleanup = effect()
      if (typeof cleanup === 'function') h.unmount.push(cleanup)
    },
    useCallback: (fn: () => void) => fn,
    useRef: () => ({ current: false }),
    useState: (init: unknown) => [init, vi.fn()],
  }
})
vi.mock('react-native', () => ({ Platform: { OS: 'ios' }, Pressable: 'Pressable', View: 'View' }))
const router = vi.hoisted(() => ({ back: vi.fn(), replace: vi.fn(), push: vi.fn() }))
vi.mock('expo-router', () => ({
  router,
  useFocusEffect: (cb: () => void) => cb(),
}))
vi.mock('@/features/auth', () => ({
  TERM_ROWS: [{ id: 'service', label: '서비스', required: true }],
  TERMS_BODY: 'body',
  TERMS_OPTIONAL: '선택',
  TERMS_PRIVACY_POLICY: 'privacy',
  TERMS_REQUIRED: '필수',
  TERMS_START: '시작',
  TERMS_TITLE: 'title',
  TRY_AGAIN: 'again',
  TermRow: () => null,
  TermsAllRow: () => null,
  isTermKey: () => false,
  saveTerms: vi.fn(),
  useTermsConsent: Object.assign(
    (selector: (s: { checked: Record<string, boolean>; toggle: () => void; toggleAll: () => void }) => unknown) =>
      selector({ checked: { service: false }, toggle: vi.fn(), toggleAll: vi.fn() }),
    { getState: () => ({ checked: { service: false }, toggle: vi.fn(), toggleAll: vi.fn(), reset: h.reset }) },
  ),
  usePhoneAuth: Object.assign(
    (selector: (s: { held: Session | null; clear: () => void }) => unknown) =>
      selector({ held: h.held, clear: h.clear }),
    { getState: () => ({ held: h.held, clear: h.clear }) },
  ),
}))
vi.mock('@/shared/infrastructure', () => ({ useSession: { getState: () => ({ set: vi.fn() }) } }))
vi.mock('@/shared/components', () => ({
  Button: () => null,
  CtaBar: ({ children }: { children: unknown }) => children,
  Text: () => null,
  TopBar: () => null,
  showToast: vi.fn(),
}))
vi.mock('@/features/my', () => ({ marketingResult: () => 'ok' }))
vi.mock('@/theme', () => ({ spacing: {}, useColors: () => ({ bg: '#fff' }) }))

const TermsScreen = (await import('./terms-screen')).default

beforeEach(() => {
  vi.clearAllMocks()
  h.held = heldSession
  h.unmount = []
})

describe('signup terms screen', () => {
  it('clears held tokens when the screen unmounts without consent', () => {
    TermsScreen()
    expect(h.clear).not.toHaveBeenCalled()
    for (const cleanup of h.unmount) cleanup()
    expect(h.clear).toHaveBeenCalledTimes(1)
    expect(h.reset).toHaveBeenCalled()
  })

  it('does not clear again after consent releases held tokens before unmount', () => {
    TermsScreen()
    h.clear.mockImplementation(() => {
      h.held = null
    })
    h.clear()
    for (const cleanup of h.unmount) cleanup()
    expect(h.clear).toHaveBeenCalledTimes(1)
  })

  it('keeps held tokens when a term document is opened', () => {
    TermsScreen()
    router.push({ pathname: '/terms-view', params: { term: 'service' } })
    expect(h.clear).not.toHaveBeenCalled()
    expect(h.held).toBe(heldSession)
  })

  it('wires the top bar back action to clear held tokens before router.back', async () => {
    const { readFileSync } = await import('node:fs')
    const source = readFileSync(new URL('./terms-screen.tsx', import.meta.url), 'utf8')
    expect(source).toContain('onBack={leave}')
    expect(source).toMatch(/const leave = \(\) => \{[^}]*clear\(\)[^}]*router\.back\(\)/s)
  })
})
