import { describe, expect, it, vi } from 'vitest'

const push = vi.fn()
vi.mock('expo-router', () => ({ router: { push } }))
vi.mock('react-native', () => ({ Keyboard: { dismiss: vi.fn() } }))

describe('showConsentModal', () => {
  it('files one confirm button, the body with its detail, and later on swipe', async () => {
    const { showConsentModal } = await import('./consent-modal')
    const { useChoiceModal } = await import('./choice-modal')
    const onAgree = vi.fn()
    const onLater = vi.fn()
    showConsentModal({ title: '제목', body: '본문', detail: '설명', agree: '동의하고 시작하기' }, { onAgree, onLater })
    const request = useChoiceModal.getState().request!
    expect(push).toHaveBeenCalledWith('/choice')
    expect(request.message).toBe('본문\n\n설명')
    expect(request.confirm?.label).toBe('동의하고 시작하기')
    request.confirm?.onPress()
    request.onDismiss?.()
    expect([onAgree.mock.calls.length, onLater.mock.calls.length]).toEqual([1, 1])
  })
})
