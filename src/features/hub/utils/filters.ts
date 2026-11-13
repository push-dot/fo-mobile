import { CAREER_STATUSES, JOB_CATEGORIES, type CareerStatus, type JobCategory, type Profile, type ProfileFilters, type Tenure } from '@push/api-client'

export type Explore = NonNullable<ProfileFilters['explore']>
export type SheetFilters = { tenure: Tenure[]; status: CareerStatus[]; explore: Explore }

export const EMPTY_SHEET: SheetFilters = { tenure: [], status: [], explore: 'recommended' }

export const tenureOf = (years: number): Tenure =>
  years <= 0 ? '0' : years <= 2 ? '1-2' : years <= 5 ? '3-5' : years <= 9 ? '6-9' : '10+'

/** The 허브 필터 board draws four 재직 기간 chips; 0–2년 stands for push-be's 0 and 1-2 together. */
export const TENURE_CHIPS: { label: string; keys: Tenure[] }[] = [
  { label: '0–2년', keys: ['0', '1-2'] },
  { label: '3–5년', keys: ['3-5'] },
  { label: '6–9년', keys: ['6-9'] },
  { label: '10년+', keys: ['10+'] },
]

type TenureChip = (typeof TENURE_CHIPS)[number]

export const tenureChipOn = (tenure: Tenure[], chip: TenureChip) => chip.keys.every((k) => tenure.includes(k))

export const toggleTenureChip = (tenure: Tenure[], chip: TenureChip): Tenure[] =>
  tenureChipOn(tenure, chip) ? tenure.filter((k) => !chip.keys.includes(k)) : [...tenure.filter((k) => !chip.keys.includes(k)), ...chip.keys]

const pickedTenureChips = (tenure: Tenure[]) => TENURE_CHIPS.filter((chip) => chip.keys.some((k) => tenure.includes(k)))

export const appliedCount = (f: SheetFilters) => pickedTenureChips(f.tenure).length + f.status.length + (f.explore === 'recommended' ? 0 : 1)

export const proposalSubtitle = (p: Pick<Profile, 'jobCategory' | 'tenureYears' | 'careerStatus'>) =>
  [careerLine(p), CAREER_STATUSES.find((s) => s.key === p.careerStatus)?.label].filter(Boolean).join(' · ')

export const filterSummary = (f: SheetFilters) =>
  [...pickedTenureChips(f.tenure), ...CAREER_STATUSES.filter((s) => f.status.includes(s.key))]
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
