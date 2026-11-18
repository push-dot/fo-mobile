import { describe, expect, it } from 'vitest'
import { MARKETING_COPY, marketingResult } from './marketing'

describe('marketingResult', () => {
  it('names the sender, the processed date and the result', () => {
    const at = new Date(2026, 10, 9, 12).toISOString()
    expect(marketingResult(true, at)).toBe('2026년 11월 9일, Push 혜택·이벤트 알림을 받기로 했어요')
    expect(marketingResult(false, at)).toBe('2026년 11월 9일, Push 혜택·이벤트 알림을 받지 않기로 했어요')
  })

  it('falls back to today when the server sends no time', () => {
    expect(marketingResult(false, null, new Date(2026, 0, 2))).toBe('2026년 1월 2일, Push 혜택·이벤트 알림을 받지 않기로 했어요')
  })
})

describe('MARKETING_COPY', () => {
  it('reads as the SettingsMarketing board draws the row', () => {
    expect(MARKETING_COPY).toEqual({ label: '혜택·이벤트 알림', sub: '할인, 이벤트, 새 기능 소식을 보내 드려요' })
  })
})
