import { beforeEach, describe, expect, it, vi } from 'vitest'

const push = vi.fn()
vi.mock('expo-router', () => ({ router: { push } }))

describe('showChoiceModal', () => {
  beforeEach(() => push.mockClear())

  it('files the request and opens the sheet route', async () => {
    const { showChoiceModal, useChoiceModal } = await import('./choice-modal')
    const request = { title: '서류 가져오기', items: [{ label: '파일에서 고르기', onPress: vi.fn() }] }
    showChoiceModal(request)
    expect(useChoiceModal.getState().request).toBe(request)
    expect(push).toHaveBeenCalledWith('/choice')
  })
})
