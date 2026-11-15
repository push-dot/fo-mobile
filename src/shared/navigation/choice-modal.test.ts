import { beforeEach, describe, expect, it, vi } from 'vitest'

const push = vi.fn()
const dismiss = vi.fn()
vi.mock('expo-router', () => ({ router: { push } }))
vi.mock('react-native', () => ({ Keyboard: { dismiss } }))

describe('showChoiceModal', () => {
  beforeEach(() => {
    push.mockClear()
    dismiss.mockClear()
  })

  it('files the request and opens the sheet route', async () => {
    const { showChoiceModal, useChoiceModal } = await import('./choice-modal')
    const request = { title: '서류 가져오기', items: [{ label: '파일에서 고르기', onPress: vi.fn() }] }
    showChoiceModal(request)
    expect(useChoiceModal.getState().request).toBe(request)
    expect(push).toHaveBeenCalledWith('/choice')
  })

  it('blurs the focused field first, so no caret is left once the sheet is swiped away', async () => {
    const { showChoiceModal } = await import('./choice-modal')
    showChoiceModal({ title: '이력서를 다 고쳤어요' })
    expect(dismiss).toHaveBeenCalledOnce()
    expect(dismiss.mock.invocationCallOrder[0]).toBeLessThan(push.mock.invocationCallOrder[0]!)
  })
})
