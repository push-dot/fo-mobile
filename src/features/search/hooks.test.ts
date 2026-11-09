import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SEARCH_DEBOUNCE_MS } from './constants'

type Cleanup = (() => void) | void
const h = vi.hoisted(() => ({ slots: [] as unknown[], deps: [] as unknown[][], cleanups: [] as Cleanup[], s: 0, e: 0 }))
vi.mock('react', () => ({
  useState: (init: unknown) => {
    const i = h.s++
    if (!(i in h.slots)) h.slots[i] = init
    return [h.slots[i], (v: unknown) => (h.slots[i] = v)]
  },
  useEffect: (fn: () => Cleanup, deps: unknown[]) => {
    const i = h.e++
    if (h.deps[i]?.every((d, k) => Object.is(d, deps[k]))) return
    h.cleanups[i]?.()
    h.deps[i] = deps
    h.cleanups[i] = fn()
  },
}))

const { useSearchQuery } = await import('./hooks')

const run = (hook: typeof useSearchQuery) => {
  h.s = 0
  h.e = 0
  return hook()
}
const render = () => run(useSearchQuery)
const type = (t: string) => {
  render().setText(t)
  return render()
}

beforeEach(() => {
  vi.useFakeTimers()
  Object.assign(h, { slots: [], deps: [], cleanups: [] })
})
afterEach(() => vi.useRealTimers())

describe('useSearchQuery', () => {
  it('runs typed text only after the debounce, trimmed', () => {
    expect(type(' 카카오 ').q).toBe('')
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1)
    expect(render().q).toBe('')
    vi.advanceTimersByTime(1)
    expect(render().q).toBe('카카오')
  })

  it('restarts the wait on each keystroke', () => {
    type('카')
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 50)
    type('카카')
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 50)
    expect(render().q).toBe('')
    vi.advanceTimersByTime(50)
    expect(render().q).toBe('카카')
  })

  it('runs a tapped term at once', () => {
    render().search('토스 ')
    expect(render()).toMatchObject({ text: '토스 ', q: '토스' })
  })

  it('clears the query without the typing wait', () => {
    render().search('토스')
    type('')
    vi.advanceTimersByTime(0)
    expect(render().q).toBe('')
  })
})
