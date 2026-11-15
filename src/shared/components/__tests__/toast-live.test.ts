import { describe, expect, it } from 'vitest'
import { hideToast, showToast, toastLive, useToastStore } from '../toast-store'

describe('toastLive', () => {
  it('holds while the toast shows and ends when it is hidden or replaced by a plain toast', () => {
    const undo = showToast({ message: '경력을 삭제했어요', action: { label: '되돌리기', onPress: () => undefined } })
    expect(toastLive(useToastStore.getState(), undo)).toBe(true)
    hideToast(undo)
    expect(toastLive(useToastStore.getState(), undo)).toBe(false)

    const first = showToast({ message: '경력을 삭제했어요', action: { label: '되돌리기', onPress: () => undefined } })
    showToast({ message: '다른 알림' })
    expect(toastLive(useToastStore.getState(), first)).toBe(false)
  })
})
