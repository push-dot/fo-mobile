import { describe, expect, it, vi } from 'vitest'

const push = vi.fn()
vi.mock('expo-router', () => ({ router: { push } }))
vi.mock('react-native', () => ({ Keyboard: { dismiss: vi.fn() } }))

describe('showConsentModal', () => {
  it('files one confirm button, the body, and later on swipe', async () => {
    const { showConsentModal } = await import('./consent-modal')
    const { useChoiceModal } = await import('./choice-modal')
    const onAgree = vi.fn()
    const onLater = vi.fn()
    showConsentModal({ title: '제목', body: '본문', agree: '동의하고 시작하기' }, { onAgree, onLater })
    const request = useChoiceModal.getState().request!
    expect(push).toHaveBeenCalledWith('/choice')
    expect(request.message).toBe('본문')
    expect(request.confirm?.label).toBe('동의하고 시작하기')
    expect(request.confirm?.secondary).toMatchObject({ label: '자세히 보기', stay: true })
    request.confirm?.secondary?.onPress()
    expect(push).toHaveBeenLastCalledWith({ pathname: '/(app)/(stack)/terms-view', params: { term: 'privacyPolicy' } })
    request.confirm?.onPress()
    request.onDismiss?.()
    expect([onAgree.mock.calls.length, onLater.mock.calls.length]).toEqual([1, 1])
  })
})
