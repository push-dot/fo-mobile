import { beforeEach, describe, expect, it, vi } from 'vitest'

const platform = vi.hoisted(() => ({ OS: 'ios' }))
vi.mock('react-native', () => ({ Platform: platform }))
vi.mock('react-native-safe-area-context', () => ({ initialWindowMetrics: { insets: { top: 62, bottom: 34, left: 0, right: 0 } } }))

const load = async () => (await import('../empty-note-style')).emptyNoteStyle

beforeEach(() => {
  vi.resetModules()
})

describe('empty note style', () => {
  it('gives the iOS home-indicator inset back from the drawn lift', async () => {
    platform.OS = 'ios'
    expect((await load())(160)).toEqual({ flex: 1, justifyContent: 'center', paddingBottom: 126 })
    expect((await load())(140).paddingBottom).toBe(106)
  })

  it('keeps the drawn lift for tab-root lists, which run to the screen bottom', async () => {
    platform.OS = 'ios'
    expect((await load())(140, false).paddingBottom).toBe(140)
  })

  it('keeps the drawn lift on Android', async () => {
    platform.OS = 'android'
    expect((await load())(160).paddingBottom).toBe(160)
  })
})
