import { describe, expect, it, vi } from 'vitest'
import { accessMenu, toneMenu, usagePercent } from '../utils/account-menus'

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
})
