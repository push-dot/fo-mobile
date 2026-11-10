import { beforeEach, describe, expect, it, vi } from 'vitest'
import { activeToastHost, hideToast, mountSheet, mountToastHost, showToast, sizeSheet, topSheet, toastDuration, toastOffsets, useToastStore } from '../toast-store'

beforeEach(() => useToastStore.setState({ current: null, queued: [], hosts: [], sheets: [] }))

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

  it('clears the toast when a sheet opens and floats later toasts over the top open sheet', () => {
    showToast({ message: '서류를 삭제했어요' })
    const closeLower = mountSheet('lower')
    expect(useToastStore.getState().current).toBeNull()
    sizeSheet('lower', 240)
    const closeUpper = mountSheet('upper')
    sizeSheet('upper', 180)
    expect(topSheet(useToastStore.getState())).toBe(180)
    closeUpper()
    expect(topSheet(useToastStore.getState())).toBe(240)
    closeLower()
    expect(topSheet(useToastStore.getState())).toBe(0)
  })

  it('keeps a live 되돌리기 toast when a failure toast arrives', () => {
    showToast({ message: '서류를 삭제했어요', action: { label: '되돌리기', onPress: vi.fn() } })
    const undo = useToastStore.getState().current!
    showToast({ message: '서류를 삭제하지 못했어요', tone: 'error', alert: true })
    expect(useToastStore.getState().current).toMatchObject({ id: undo.id, message: '서류를 삭제했어요', action: { label: '되돌리기' } })
    hideToast(undo.id)
    expect(useToastStore.getState().current).toMatchObject({ message: '서류를 삭제하지 못했어요', tone: 'error' })
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
    expect(toastOffsets(60)).toEqual({ tabs: 74, docsError: 210, cta: 92 })
    expect(toastOffsets(80)).toEqual({ tabs: 94, docsError: 230, cta: 92 })
  })
})
