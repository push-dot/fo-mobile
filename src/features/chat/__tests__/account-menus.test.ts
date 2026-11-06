import { describe, expect, it, vi } from 'vitest'
import { accessMenu, currentRole, toneLabel, toneMenu, usagePercent } from '../utils/account-menus'

vi.mock('@/features/my', async () => ({ TONES: (await import('../../my/constants')).TONES }))

describe('account inline menus', () => {
  it('tone menu selects current', () => {
    const pick = vi.fn()
    const actions = toneMenu('concise', pick)
    expect(actions.map((a) => a.label)).toEqual(['그대로', '전문적인', '자신감 있는', '간결한', '기술 중심', '친근한'])
    expect(actions.findIndex((a) => a.selected)).toBe(3)
    actions[1]!.onPress()
    expect(pick).toHaveBeenCalledWith('professional')
  })

  it('tone menu marks 그대로 when no tone is saved', () => {
    expect(toneMenu(undefined, () => {}).findIndex((a) => a.selected)).toBe(0)
  })

  it('access menu selects current', () => {
    const pick = vi.fn()
    const actions = accessMenu('BYPASS', pick)
    expect(actions.map((a) => a.label)).toEqual(['항상 묻기', '자동', '바로 실행'])
    expect(actions.findIndex((a) => a.selected)).toBe(2)
    actions[0]!.onPress()
    expect(pick).toHaveBeenCalledWith('ALWAYS_ASK')
  })

  it('usage percent rounds, clamps and hides without credits', () => {
    expect(usagePercent({ used: 64, total: 100 })).toBe(64)
    expect(usagePercent({ used: 150, total: 100 })).toBe(100)
    expect(usagePercent({ used: 1, total: 3 })).toBe(33)
    expect(usagePercent({ used: 0, total: 0 })).toBeNull()
    expect(usagePercent(null)).toBeNull()
  })

  it('names the tone row 그대로 for the default tone and "<tone> 말투" otherwise', () => {
    expect(toneLabel()).toBe('그대로')
    expect(toneLabel({ key: 'as_is', label: '그대로' })).toBe('그대로')
    expect(toneLabel({ key: 'friendly', label: '친근한' })).toBe('친근한 말투')
  })

  it('reads the role of the current job, then the headline', () => {
    const careers = [
      { role: '서버 개발자', endedOn: '2022-02' },
      { role: '백엔드 엔지니어', endedOn: null },
    ]
    expect(currentRole({ headline: '결제 시스템을 만드는 백엔드 개발자', careers })).toBe('백엔드 엔지니어')
    expect(currentRole({ headline: '결제 시스템을 만드는 백엔드 개발자', careers: [] })).toBe('결제 시스템을 만드는 백엔드 개발자')
    expect(currentRole(undefined)).toBeUndefined()
  })
})
