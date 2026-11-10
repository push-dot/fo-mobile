import { beforeEach, describe, expect, it, vi } from 'vitest'
import { activeToastHost, hideToast, mountSheet, mountToastHost, showToast, sizeSheet, topSheet, toastDuration, toastOffsets, useToastStore } from '../toast-store'

const undo = (message: string) => showToast({ message, action: { label: '되돌리기', onPress: vi.fn() } })
const failure = (message: string) => showToast({ message, tone: 'error', alert: true })

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

  it('keeps queued toasts in order when a normal toast replaces a live undo, and shows that queue next', () => {
    undo('서류를 삭제했어요')
    failure('먼저 온 실패')
    failure('다음 실패')
    showToast({ message: '저장했어요' })
    expect(useToastStore.getState().current).toMatchObject({ message: '저장했어요' })
    expect(useToastStore.getState().queued.map((toast) => toast.message)).toEqual(['먼저 온 실패', '다음 실패'])
    hideToast(useToastStore.getState().current!.id)
    expect(useToastStore.getState().current).toMatchObject({ message: '먼저 온 실패' })
    hideToast(useToastStore.getState().current!.id)
    expect(useToastStore.getState().current).toMatchObject({ message: '다음 실패' })
    expect(useToastStore.getState().queued).toEqual([])
  })

  it('removes a queued toast by id and still shows whatever is left', () => {
    undo('서류를 삭제했어요')
    failure('먼저 온 실패')
    failure('다음 실패')
    const [first] = useToastStore.getState().queued
    hideToast(first!.id)
    expect(useToastStore.getState().current).toMatchObject({ message: '서류를 삭제했어요' })
    expect(useToastStore.getState().queued.map((toast) => toast.message)).toEqual(['다음 실패'])
    hideToast(useToastStore.getState().current!.id)
    expect(useToastStore.getState().current).toMatchObject({ message: '다음 실패' })
  })

  it('clears the toast and its queue when a sheet opens on Android, and floats later toasts over the top open sheet', () => {
    undo('서류를 삭제했어요')
    failure('서류를 삭제하지 못했어요')
    const closeLower = mountSheet('lower', 'android')
    expect(useToastStore.getState().current).toBeNull()
    expect(useToastStore.getState().queued).toEqual([])
    sizeSheet('lower', 240)
    const closeUpper = mountSheet('upper', 'android')
    sizeSheet('upper', 180)
    expect(topSheet(useToastStore.getState())).toBe(180)
    closeUpper()
    expect(topSheet(useToastStore.getState())).toBe(240)
    closeLower()
    expect(topSheet(useToastStore.getState())).toBe(0)
  })

  it('keeps the toast and its queue when a sheet opens on iOS', () => {
    undo('서류를 삭제했어요')
    failure('서류를 삭제하지 못했어요')
    const close = mountSheet('sheet', 'ios')
    expect(useToastStore.getState().current).toMatchObject({ message: '서류를 삭제했어요' })
    expect(useToastStore.getState().queued.map((toast) => toast.message)).toEqual(['서류를 삭제하지 못했어요'])
    sizeSheet('sheet', 200)
    expect(topSheet(useToastStore.getState())).toBe(200)
    close()
    expect(topSheet(useToastStore.getState())).toBe(0)
    expect(useToastStore.getState().current).toMatchObject({ message: '서류를 삭제했어요' })
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
