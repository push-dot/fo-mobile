import { describe, expect, it } from 'vitest'
import type { Profile } from '@push/api-client'
import { appliedCount, careerLine, EMPTY_SHEET, filterSummary, givenName, matchesSheet, profileQuery, tenureOf } from './filters'

describe('hub filters', () => {
  it('buckets tenure years', () => {
    expect([0, 2, 3, 5, 6, 9, 10, 15].map(tenureOf)).toEqual(['0-2', '0-2', '3-5', '3-5', '6-9', '6-9', '10+', '10+'])
  })

  it('summarises and counts applied filters', () => {
    const f = { ...EMPTY_SHEET, status: ['seeking' as const], tenure: ['3-5' as const] }
    expect(filterSummary(f)).toBe('3–5년 · 이직/구직중')
    expect(appliedCount(f)).toBe(2)
    expect(appliedCount({ ...f, explore: 'offers' })).toBe(3)
    expect(filterSummary(EMPTY_SHEET)).toBe('')
  })

  it('formats card lines', () => {
    expect(careerLine({ jobCategory: 'dev', tenureYears: 5 })).toBe('개발 · 5년차')
    expect(careerLine({ jobCategory: null, tenureYears: 0 })).toBe('신입')
    expect(careerLine({ jobCategory: 'plan', tenureYears: null })).toBe('기획')
    expect(givenName('김태윤')).toBe('태윤')
  })

  it('sends one tenure/status to push-be and narrows multi-picks locally', () => {
    const one = { ...EMPTY_SHEET, tenure: ['3-5' as const], status: ['seeking' as const] }
    expect(profileQuery(['dev'], one)).toEqual({ category: ['dev'], explore: 'recommended', tenure: '3-5', status: 'seeking' })
    const many = { ...EMPTY_SHEET, tenure: ['0-2' as const, '10+' as const] }
    expect(profileQuery([], many).tenure).toBeUndefined()
    const p = (tenureYears: number | null) => ({ tenureYears, careerStatus: null }) as Profile
    expect([p(1), p(4), p(12), p(null)].map((x) => matchesSheet(x, many))).toEqual([true, false, true, false])
    expect(matchesSheet(p(4), one)).toBe(true)
  })
})
