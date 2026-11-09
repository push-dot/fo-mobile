import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => ({ focused: false, slots: [] as unknown[], s: 0 }))
vi.mock('react', async (orig) => ({
  ...(await orig<typeof import('react')>()),
  useState: (init: unknown) => {
    const i = h.s++
    if (!(i in h.slots)) h.slots[i] = init
    return [h.slots[i], (v: unknown) => (h.slots[i] = v)]
  },
}))
vi.mock('expo-router', () => ({ useIsFocused: () => h.focused, Stack: Object.assign(() => null, { Screen: () => null }) }))
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }))
vi.mock('@/theme', () => ({ useColors: () => ({}), radius: {} }))
vi.mock('@/screens/home/home-screen', () => ({ default: 'HomeScreen' }))
vi.mock('@/screens/hub/hub-screen', () => ({ default: 'HubScreen' }))
vi.mock('@/screens/social/social-screen', () => ({ default: 'SocialScreen' }))
vi.mock('@/screens/my/my-screen', () => ({ default: 'MyScreen' }))

const { Stack } = await import('expo-router')
const { useFocusedOnce } = await import('./use-focused-once')
const tabs = await Promise.all(
  [
    ['(home)', 'index', 'HomeScreen'],
    ['(hub)', 'hub', 'HubScreen'],
    ['(social)', 'social', 'SocialScreen'],
    ['(my)', 'my', 'MyScreen'],
  ].map(async ([group, root, screen]) => ({
    group,
    screen,
    Layout: (await import(`@/app/(app)/(stack)/(tabs)/${group}/_layout.tsx`)).default as () => { type: unknown },
    Root: (await import(`@/app/(app)/(stack)/(tabs)/${group}/${root}.tsx`)).default as () => { type: unknown } | null,
  })),
)

const render = <T,>(f: () => T) => {
  h.s = 0
  return f()
}

beforeEach(() => {
  h.focused = false
  h.slots = []
})

describe('useFocusedOnce', () => {
  it('is false until the first focus and stays true after a blur', () => {
    expect(render(useFocusedOnce)).toBe(false)
    h.focused = true
    expect(render(useFocusedOnce)).toBe(true)
    h.focused = false
    expect(render(useFocusedOnce)).toBe(true)
  })
})

describe.each(tabs)('$group tab', ({ screen, Layout, Root }) => {
  it('registers its Stack before the first focus, so a push into the tab keeps its first screen under it', () => {
    expect(render(Layout).type).toBe(Stack)
  })

  it('mounts its first screen on the first focus and keeps it after a blur', () => {
    expect(render(Root)).toBeNull()
    h.focused = true
    expect(render(Root)?.type).toBe(screen)
    h.focused = false
    expect(render(Root)?.type).toBe(screen)
  })
})
