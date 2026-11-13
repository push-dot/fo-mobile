import { describe, expect, it } from 'vitest'
import { EMPTY, MAX_REGIONS, SIDOS, addRegion, chipText, regionLabel, toQuery, toggleRegion } from './filters'

describe('jobs filters', () => {
  it('labels chips in sheet order', () => {
    expect(chipText('category', EMPTY)).toBe('직군')
    expect(chipText('careerYears', EMPTY)).toBe('경력')
  })

  it('prefixes a single pick with the filter title', () => {
    expect(chipText('category', { ...EMPTY, category: ['dev'] })).toBe('직군 · 개발')
    expect(chipText('careerYears', { ...EMPTY, careerYears: ['4-6'] })).toBe('경력 · 4–6년')
    expect(chipText('location', { ...EMPTY, location: ['제주'] })).toBe('지역 · 제주')
  })

  it('shows the first pick and the rest count for several picks', () => {
    expect(chipText('category', { ...EMPTY, category: ['data', 'dev'] })).toBe('개발 외 1')
    expect(chipText('skills', { ...EMPTY, skills: ['Kotlin', 'Go', 'Rust'] })).toBe('Kotlin 외 2')
  })

  it('sends only set filters', () => {
    expect(toQuery({ ...EMPTY, skills: ['Go'] })).toEqual({ skills: ['Go'] })
  })

  it('keeps whole sido and its districts exclusive', () => {
    expect(toggleRegion(['서울 강남구', '서울 서초구', '경기 성남시'], '서울')).toEqual(['경기 성남시', '서울'])
    expect(toggleRegion(['서울', '원격'], '서울 강남구')).toEqual(['원격', '서울 강남구'])
    expect(toggleRegion(['서울 강남구'], '서울 강남구')).toEqual([])
  })

  it('adds a wheel pick once and stops at the cap', () => {
    expect(addRegion(['서울 강남구'], '서울 강남구')).toEqual(['서울 강남구'])
    expect(addRegion(['서울 강남구'], '서울 서초구')).toEqual(['서울 강남구', '서울 서초구'])
    expect(addRegion(['서울 강남구', '서울 서초구'], '서울')).toEqual(['서울'])
    const full = ['서울 강남구', '서울 서초구', '경기 성남시', '인천 부평구', '부산 해운대구']
    expect(full).toHaveLength(MAX_REGIONS)
    expect(addRegion(full, '대전 서구')).toEqual(full)
  })

  it('reads a whole sido as 전체 and keeps a district as is', () => {
    expect(regionLabel('서울')).toBe('서울 전체')
    expect(regionLabel('서울 강남구')).toBe('서울 강남구')
    expect(regionLabel('원격')).toBe('원격')
  })

  it('lists the 12 provinces in board order', () => {
    expect([...SIDOS]).toEqual(['서울', '경기', '인천', '부산', '대전', '원격', '대구', '광주', '울산', '세종', '강원', '제주'])
  })
})
