import { describe, expect, it, vi } from 'vitest'

const a11y = vi.hoisted(() => ({
  handlers: new Map<string, (on: boolean) => void>(),
  motion: () => Promise.resolve(false),
  transparency: () => Promise.resolve(false),
}))

vi.mock('react', () => ({
  useSyncExternalStore: (subscribe: (l: () => void) => () => void, get: () => boolean) => ({ subscribe, get }),
}))
vi.mock('react-native', () => ({
  AccessibilityInfo: {
    isReduceMotionEnabled: () => a11y.motion(),
    isReduceTransparencyEnabled: () => a11y.transparency(),
    addEventListener: (event: string, handler: (on: boolean) => void) => a11y.handlers.set(event, handler),
  },
}))

type Store = { subscribe: (l: () => void) => () => void; get: () => boolean }

const load = async () => {
  vi.resetModules()
  a11y.handlers.clear()
  return import('./use-reduce-motion')
}

describe('accessibility flag store', () => {
  it('stays off when the platform query rejects', async () => {
    a11y.transparency = () => Promise.reject(new Error('unsupported'))
    const { useReduceTransparency } = await load()
    await Promise.resolve()
    expect((useReduceTransparency() as unknown as Store).get()).toBe(false)
    a11y.transparency = () => Promise.resolve(false)
  })

  it('notifies subscribers once per change', async () => {
    const { useReduceMotion } = await load()
    const store = useReduceMotion() as unknown as Store
    const listener = vi.fn()
    const off = store.subscribe(listener)
    const change = a11y.handlers.get('reduceMotionChanged')!
    change(true)
    change(true)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(store.get()).toBe(true)
    off()
    change(false)
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
