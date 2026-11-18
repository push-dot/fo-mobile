import { describe, expect, it, vi } from 'vitest'

const push = vi.fn()
vi.mock('expo-router', () => ({ router: { push } }))
vi.mock('react-native', () => ({ Keyboard: { dismiss: vi.fn() } }))

describe('showConsentModal', () => {
  it('opens the consent route with the copy and both exits', async () => {
    const { showConsentModal, useConsentModal } = await import('./consent-modal')
    const onAgree = vi.fn()
    const onLater = vi.fn()
    showConsentModal({ title: '제목', body: '본문', agree: '동의하고 시작하기' }, { onAgree, onLater })
    const request = useConsentModal.getState().request!
    expect(push).toHaveBeenCalledWith('/consent')
    expect([request.title, request.body, request.agree]).toEqual(['제목', '본문', '동의하고 시작하기'])
    request.onAgree()
    request.onLater?.()
    expect([onAgree.mock.calls.length, onLater.mock.calls.length]).toEqual([1, 1])
  })

  it('has no 나중에 when only agreeing is offered (the consent is required)', async () => {
    const { showConsentModal, useConsentModal } = await import('./consent-modal')
    showConsentModal({ title: '제목', body: '본문', agree: '동의하고 시작하기' }, { onAgree: vi.fn() })
    expect(useConsentModal.getState().request!.onLater).toBeUndefined()
  })
})
