import type { BlockedUser } from '@push/api-client'
import { describe, expect, it } from 'vitest'
import { blockedCount, blockedLine } from './blocked'

const row = (createdAt: string, companyName?: string | null): BlockedUser => ({ user: { id: 'u1', displayName: '오지현', companyName }, createdAt })
const NOW = new Date(2026, 10, 8)

describe('blockedLine', () => {
  it('reads the blocked date, without the company', () => {
    expect(blockedLine(row(new Date(2026, 10, 7, 12).toISOString(), '모아페이'), NOW)).toBe('11월 7일 차단')
    expect(blockedLine(row(new Date(2026, 9, 3, 12).toISOString()), NOW)).toBe('10월 3일 차단')
  })

  it('adds the year for an earlier year', () => {
    expect(blockedLine(row(new Date(2025, 9, 3, 12).toISOString()), NOW)).toBe('2025년 10월 3일 차단')
  })
})

describe('blockedCount', () => {
  it('reads N명, 0명 included, and nothing until the total is known', () => {
    expect(blockedCount(2)).toBe('2명')
    expect(blockedCount(0)).toBe('0명')
    expect(blockedCount(undefined)).toBeUndefined()
  })
})
