import { describe, expect, it } from 'vitest'
import type { ApplicationDetail } from '../types'
import { appliedFit } from './applied-fit'

const stored = (over: Partial<NonNullable<ApplicationDetail['fit']>> = {}): NonNullable<ApplicationDetail['fit']> => ({
  fitScore: 6.9,
  parts: { techStack: 7.5, experienceLink: 7, careerLevel: 8, keyword: 4.5, domain: 5 },
  topGap: 'Kafka 운영 경험과 부하 테스트 근거가 부족해요',
  plan: 'PRO',
  reachable: 8.2,
  documentId: 'd1',
  documentTitle: '김서준_백엔드_이력서_2026',
  ...over,
})

describe('applied job fit card', () => {
  it('draws the stored fit as MyAppliedJob does', () => {
    expect(appliedFit(69, stored())).toEqual({
      score: '6.9',
      title: '내 적합도 · 김서준_백엔드_이력서_2026',
      headline: '조금만 고치면 8점대예요',
      parts: [
        { label: '기술 스택', value: '7.5', pct: 75, low: false },
        { label: '경험 연관성', value: '7.0', pct: 70, low: false },
        { label: '키워드', value: '4.5', pct: 45, low: true },
      ],
      weakness: 'Kafka 운영 경험과 부하 테스트 근거가 부족해요',
    })
  })

  it('promises a band only when fixing the weakest part reaches a higher one', () => {
    expect(appliedFit(null, stored({ fitScore: 8.2, reachable: 8.9 }))?.headline).toBeNull()
  })

  it('withholds the parts, the band, and the weakness of a FREE fit', () => {
    expect(appliedFit(69, stored({ plan: 'FREE' }))).toEqual({
      score: '6.9',
      title: '내 적합도 · 김서준_백엔드_이력서_2026',
      headline: null,
      parts: [],
      weakness: null,
    })
  })

  it('falls back to the list score until a fit is stored, and draws nothing without either', () => {
    expect(appliedFit(69, undefined)).toEqual({ score: '6.9', title: '내 적합도', headline: null, parts: [], weakness: null })
    expect(appliedFit(null, undefined)).toBeNull()
    expect(appliedFit(null, stored({ documentTitle: null }))?.title).toBe('내 적합도')
  })
})
