import { beforeEach, describe, expect, it, vi } from 'vitest'
import { activeToastHost, hideToast, mountToastHost, showToast, toastDuration, toastOffsets, useToastStore } from '../toast-store'

beforeEach(() => useToastStore.setState({ current: null, hosts: [] }))

describe('toast store', () => {
  it('shows the newest toast in place of the current one', () => {
    showToast({ message: '저장했어요' })
    const first = useToastStore.getState().current!.id
    showToast({ message: '링크를 지웠어요' })
    expect(useToastStore.getState().current).toMatchObject({ message: '링크를 지웠어요' })
    expect(useToastStore.getState().current!.id).not.toBe(first)
  })

  it('ignores a hide for a toast that was already replaced', () => {
    showToast({ message: 'a' })
    const stale = useToastStore.getState().current!.id
    showToast({ message: 'b' })
    hideToast(stale)
    expect(useToastStore.getState().current).toMatchObject({ message: 'b' })
    hideToast(useToastStore.getState().current!.id)
    expect(useToastStore.getState().current).toBeNull()
  })

  it('keeps an undo toast up longer than a plain one', () => {
    expect(toastDuration({ message: 'a', action: { label: '되돌리기', onPress: vi.fn() } })).toBeGreaterThan(toastDuration({ message: 'a' }))
  })
})

describe('toast hosts', () => {
  it('lets the last mounted host show toasts and hands back on unmount', () => {
    const unmountRoot = mountToastHost('root')
    const unmountSheet = mountToastHost('sheet')
    expect(activeToastHost(useToastStore.getState())).toBe('sheet')
    unmountSheet()
    expect(activeToastHost(useToastStore.getState())).toBe('root')
    unmountRoot()
    expect(activeToastHost(useToastStore.getState())).toBeUndefined()
  })
})

describe('toast offsets', () => {
  it('keep the artboard gaps above the tab bar', () => {
    expect(toastOffsets(60)).toEqual({ tabs: 74, docsCta: 160, docsError: 210, cta: 92 })
    expect(toastOffsets(80)).toEqual({ tabs: 94, docsCta: 180, docsError: 230, cta: 92 })
  })
})
