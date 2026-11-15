import { beforeEach, describe, expect, it, vi } from 'vitest'

const alert = vi.hoisted(() => vi.fn())
vi.mock('react-native', () => ({ Alert: { alert } }))

const { showConsentAlert } = await import('../consent-alert')

const copy = { title: 'Bot을 쓰려면\n동의가 필요해요', body: '본문', more: '자세히 보기', detail: '자세한 설명', agree: '동의하고 시작하기', later: '나중에' }

beforeEach(() => alert.mockClear())

describe('showConsentAlert', () => {
  it('asks in one platform alert: agree first and preferred, 자세히 보기, then the cancel', () => {
    const onAgree = vi.fn()
    const onLater = vi.fn()
    showConsentAlert(copy, { onAgree, onLater })
    const [title, body, buttons, options] = alert.mock.calls[0]!
    expect(title).toBe('Bot을 쓰려면 동의가 필요해요')
    expect(body).toBe('본문')
    expect(buttons.map((b: { text: string }) => b.text)).toEqual(['동의하고 시작하기', '자세히 보기', '나중에'])
    expect(buttons[0].isPreferred).toBe(true)
    expect(buttons[2].style).toBe('cancel')
    buttons[0].onPress()
    options.onDismiss()
    expect([onAgree.mock.calls.length, onLater.mock.calls.length]).toEqual([1, 1])
  })

  it('opens the detail in a second alert that keeps agree and later', () => {
    showConsentAlert(copy, { onAgree: vi.fn(), onLater: vi.fn() })
    alert.mock.calls[0]![2][1].onPress()
    const [, body, buttons] = alert.mock.calls[1]!
    expect(body).toBe('본문\n\n자세한 설명')
    expect(buttons.map((b: { text: string }) => b.text)).toEqual(['동의하고 시작하기', '나중에'])
  })
})
