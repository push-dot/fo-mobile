import type { Session } from '@push/api-client'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => ({
  held: null as Session | null,
  clear: vi.fn(),
  reset: vi.fn(),
  focused: true,
  unmount: [] as (() => void)[],
  hardwareBack: null as (() => void) | null,
  setSession: vi.fn(),
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
    useRef: (init: unknown) => ({ current: init }),
    useState: (init: unknown) => [init, vi.fn()],
  }
})
vi.mock('react-native', () => ({ Platform: { OS: 'ios' }, Pressable: 'Pressable', View: 'View' }))
const router = vi.hoisted(() => ({ back: vi.fn(), dismissTo: vi.fn(), replace: vi.fn(), push: vi.fn() }))
vi.mock('expo-router', () => ({
  router,
  Stack: { Screen: 'Stack.Screen' },
  useFocusEffect: (cb: () => void) => cb(),
  useIsFocused: () => h.focused,
}))
vi.mock('@/features/auth', () => ({
  TRY_AGAIN: 'again',
  TermsConsentForm: () => null,
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
vi.mock('@/shared/infrastructure', () => ({ useSession: { getState: () => ({ set: h.setSession }) } }))
vi.mock('@/shared/utility', () => ({
  useHardwareBack: (onBack: (() => void) | null) => {
    h.hardwareBack = onBack
  },
}))
vi.mock('@/shared/components', () => ({
  showToast: vi.fn(),
}))
vi.mock('@/features/my', () => ({ marketingResult: () => 'ok' }))
vi.mock('@/theme', () => ({ spacing: {}, useColors: () => ({ bg: '#fff' }) }))

const TermsScreen = (await import('./terms-screen')).default
const { saveTerms } = await import('@/features/auth')

type Consent = Awaited<ReturnType<typeof saveTerms>>
type FormProps = { onBack: () => void; onSubmit: (marketing: boolean) => void }
const renderForm = () => {
  const screen = TermsScreen() as ReactElement<{ children: [ReactElement, ReactElement<FormProps>] }>
  return screen.props.children[1].props
}

beforeEach(() => {
  vi.clearAllMocks()
  h.held = heldSession
  h.unmount = []
  h.hardwareBack = null
  h.focused = true
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

  it('leaves for sign-in with one navigation and lets unmount clear held tokens', () => {
    renderForm().onBack()
    expect(router.dismissTo).toHaveBeenCalledTimes(1)
    expect(router.dismissTo).toHaveBeenCalledWith('/sign-in')
    expect(router.back).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalled()
    expect(h.clear).not.toHaveBeenCalled()
  })
  it('routes hardware back through the same single navigation to sign-in', () => {
    renderForm()
    h.hardwareBack?.()
    expect(router.dismissTo).toHaveBeenCalledTimes(1)
    expect(router.dismissTo).toHaveBeenCalledWith('/sign-in')
    expect(router.back).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('releases hardware back while a term document covers the screen', () => {
    h.focused = false
    renderForm()
    expect(h.hardwareBack).toBeNull()
  })

  it('does not sign in when the user leaves while consent is saving', async () => {
    let resolve: (consent: Consent) => void = () => undefined
    vi.mocked(saveTerms).mockReturnValue(new Promise((r) => (resolve = r)))
    const form = renderForm()
    form.onSubmit(false)
    form.onBack()
    resolve({ referenceData: false, updatedAt: null })
    await new Promise((r) => setTimeout(r, 0))
    expect(h.setSession).not.toHaveBeenCalled()
    expect(h.clear).not.toHaveBeenCalled()
  })
})
