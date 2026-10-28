import { describe, expect, it } from 'vitest'
import { groupLabel, timeLabel } from './format'

const now = new Date(2026, 9, 20, 15, 0)
const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).toISOString()

describe('notification time labels', () => {
  it('formats like the board', () => {
    expect(timeLabel(at(20, 14, 50), now)).toBe('10분 전')
    expect(timeLabel(at(20, 13), now)).toBe('2시간 전')
    expect(timeLabel(at(20, 9), now)).toBe('오전 9:00')
    expect(timeLabel(at(19, 22), now)).toBe('어제')
    expect(timeLabel(at(17, 10), now)).toBe('10월 17일')
  })

  it('groups by day', () => {
    expect(groupLabel(at(20, 1), now)).toBe('오늘')
    expect(groupLabel(at(16, 1), now)).toBe('이번 주')
    expect(groupLabel(at(1, 1), now)).toBe('이전')
  })
})
