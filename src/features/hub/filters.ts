import { CAREER_STATUSES, JOB_CATEGORIES, TENURES, type CareerStatus, type JobCategory, type Profile, type ProfileFilters, type Tenure } from '@push/api-client'

/** Sheet-owned filters; 직군 chips live on the screen itself. */
export type SheetFilters = { tenure: Tenure[]; status: CareerStatus[]; explore: 'recommended' | 'offers' }

export const EMPTY_SHEET: SheetFilters = { tenure: [], status: [], explore: 'recommended' }

export const tenureOf = (years: number): Tenure => (years <= 2 ? '0-2' : years <= 5 ? '3-5' : years <= 9 ? '6-9' : '10+')

// 추천 is the default view, so only tenure/status/제안 count toward the badge (board: "필터 2개 적용됨").
export const appliedCount = (f: SheetFilters) => f.tenure.length + f.status.length + (f.explore === 'offers' ? 1 : 0)

/** "3–5년 · 이직/구직중" subtitle in label order. */
export const filterSummary = (f: SheetFilters) =>
  [...TENURES.filter((t) => f.tenure.includes(t.key)), ...CAREER_STATUSES.filter((s) => f.status.includes(s.key))]
    .map((x) => x.label)
    .join(' · ')

export const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

const label = <K extends string>(list: { key: K; label: string }[], k: K) => list.find((x) => x.key === k)?.label ?? k

export const categoryLabel = (k: JobCategory) => label(JOB_CATEGORIES, k)
export const statusLabel = (k: CareerStatus) => label(CAREER_STATUSES, k)

/** "개발 · 5년차"; unset parts are left out. */
export const careerLine = (p: Pick<Profile, 'jobCategory' | 'tenureYears'>) =>
  [p.jobCategory && categoryLabel(p.jobCategory), p.tenureYears == null ? null : p.tenureYears === 0 ? '신입' : `${p.tenureYears}년차`]
    .filter(Boolean)
    .join(' · ')

// shortcut: push-be filters one tenure and one status; with 2+ picked we send none and narrow each page here
// (lists can look short and the sheet count is off). Send comma lists once push-be accepts them.
/** Sheet + chips → GET profiles query. */
export const profileQuery = (category: JobCategory[], f: SheetFilters): ProfileFilters => ({
  category,
  explore: f.explore,
  tenure: f.tenure.length === 1 ? f.tenure[0] : undefined,
  status: f.status.length === 1 ? f.status[0] : undefined,
})

/** Client-side half of profileQuery for multi-picks. */
export const matchesSheet = (p: Profile, f: SheetFilters) =>
  (f.tenure.length < 2 || (p.tenureYears != null && f.tenure.includes(tenureOf(p.tenureYears)))) &&
  (f.status.length < 2 || (p.careerStatus != null && f.status.includes(p.careerStatus)))

/** Avatar initials: given name for 3-syllable Korean names (김태윤 → 태윤). */
export const givenName = (name: string) => (name.length === 3 ? name.slice(1) : name.slice(0, 2))
