import type { ApplicationDetail, FitPartKey } from '../types'
import { fitTen } from './fit-ten'

export const APPLIED_FIT_LABEL = '적합도 자세히 보기 · Bot으로 이동'

// MyAppliedJob draws three of the five parts.
const PARTS: readonly (readonly [FitPartKey, string])[] = [
  ['techStack', '기술 스택'],
  ['experienceLink', '경험 연관성'],
  ['keyword', '키워드'],
]

export type AppliedFit = {
  score: string
  title: string
  parts: { label: string; value: string; pct: number; low: boolean }[]
  weakness: string | null
}

/** The applied job's fit card. Without a stored fit it shows the list's score alone; a FREE fit hides the parts, as the web's card does. */
export const appliedFit = (listScore: number | null | undefined, fit: ApplicationDetail['fit']): AppliedFit | null => {
  if (!fit) {
    const score = fitTen(listScore)
    return score ? { score, title: '내 적합도', parts: [], weakness: null } : null
  }
  const open = fit.plan === 'PRO' || fit.plan === 'ULTRA'
  return {
    score: fit.fitScore.toFixed(1),
    title: '내 적합도 · 허브 프로필 기준',
    parts: open
      ? PARTS.map(([key, label]) => ({ label, value: fit.parts[key].toFixed(1), pct: fit.parts[key] * 10, low: fit.parts[key] < 5 }))
      : [],
    weakness: open && fit.topGap ? fit.topGap : null,
  }
}
