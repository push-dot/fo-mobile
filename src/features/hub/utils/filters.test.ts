import { describe, expect, it } from 'vitest'
import { appliedCount, careerLine, EMPTY_SHEET, filterSummary, givenName, profileQuery, tenureOf } from './filters'

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

  it('sends every picked tenure and status to push-be', () => {
    const many = { ...EMPTY_SHEET, tenure: ['0-2' as const, '10+' as const], status: ['seeking' as const] }
    expect(profileQuery(['dev'], many)).toEqual({
      category: ['dev'],
      explore: 'recommended',
      tenure: ['0-2', '10+'],
      status: ['seeking'],
    })
  })
})
