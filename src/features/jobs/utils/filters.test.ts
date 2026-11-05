import { describe, expect, it } from 'vitest'
import { EMPTY, chipText, toQuery, toggleRegion } from './filters'

describe('jobs filters', () => {
  it('labels chips in sheet order', () => {
    expect(chipText('category', EMPTY)).toBe('직군')
    expect(chipText('category', { ...EMPTY, category: ['dev'] })).toBe('개발')
    expect(chipText('category', { ...EMPTY, category: ['data', 'dev'] })).toBe('개발 외 1')
    expect(chipText('careerYears', { ...EMPTY, careerYears: ['4-6'] })).toBe('경력 4–6년')
  })

  it('career chip keeps the 경력 prefix', () => {
    expect(chipText('careerYears', { ...EMPTY, careerYears: ['4-6', '7-9'] })).toBe('경력 4–6년 외 1')
    expect(chipText('careerYears', EMPTY)).toBe('경력')
  })

  it('category chip shows the value only', () => {
    expect(chipText('category', { ...EMPTY, category: ['dev'] })).toBe('개발')
    expect(chipText('employmentType', { ...EMPTY, employmentType: ['full_time'] })).toBe('정규직')
  })

  it('sends only set filters', () => {
    expect(toQuery({ ...EMPTY, skills: ['Go'] })).toEqual({ skills: ['Go'] })
  })

  it('keeps whole sido and its districts exclusive', () => {
    expect(toggleRegion(['서울 강남구', '서울 서초구', '경기 성남시'], '서울')).toEqual(['경기 성남시', '서울'])
    expect(toggleRegion(['서울', '원격'], '서울 강남구')).toEqual(['원격', '서울 강남구'])
    expect(toggleRegion(['서울 강남구'], '서울 강남구')).toEqual([])
  })
})
