import { CAREER_STATUSES, JOB_CATEGORIES, TENURES, type CareerStatus, type JobCategory, type Profile, type ProfileFilters, type Tenure } from '@push/api-client'

export type SheetFilters = { tenure: Tenure[]; status: CareerStatus[]; explore: 'recommended' | 'offers' }

export const EMPTY_SHEET: SheetFilters = { tenure: [], status: [], explore: 'recommended' }

export const tenureOf = (years: number): Tenure => (years <= 2 ? '0-2' : years <= 5 ? '3-5' : years <= 9 ? '6-9' : '10+')

export const appliedCount = (f: SheetFilters) => f.tenure.length + f.status.length + (f.explore === 'offers' ? 1 : 0)

export const filterSummary = (f: SheetFilters) =>
  [...TENURES.filter((t) => f.tenure.includes(t.key)), ...CAREER_STATUSES.filter((s) => f.status.includes(s.key))]
    .map((x) => x.label)
    .join(' · ')

export const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

const label = <K extends string>(list: { key: K; label: string }[], k: K) => list.find((x) => x.key === k)?.label ?? k

export const categoryLabel = (k: JobCategory) => label(JOB_CATEGORIES, k)
export const statusLabel = (k: CareerStatus) => label(CAREER_STATUSES, k)

export const careerLine = (p: Pick<Profile, 'jobCategory' | 'tenureYears'>) =>
  [p.jobCategory && categoryLabel(p.jobCategory), p.tenureYears == null ? null : p.tenureYears === 0 ? '신입' : `${p.tenureYears}년차`]
    .filter(Boolean)
    .join(' · ')

export const profileQuery = (category: JobCategory[], f: SheetFilters): ProfileFilters => ({
  category,
  explore: f.explore,
  tenure: f.tenure,
  status: f.status,
})

export const givenName = (name: string) => (name.length === 3 ? name.slice(1) : name.slice(0, 2))
