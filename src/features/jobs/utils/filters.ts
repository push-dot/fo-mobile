import {
  CAREER_YEARS, EMPLOYMENT_TYPES, JOB_CATEGORIES, chipLabel,
  type CareerYears, type EmploymentType, type JobCategory, type PostingFilters,
} from '@push/api-client'

export type Filters = {
  category: JobCategory[]
  skills: string[]
  careerYears: CareerYears[]
  location: string[]
  employmentType: EmploymentType[]
}
export type FilterKey = keyof Filters

export const EMPTY: Filters = { category: [], skills: [], careerYears: [], location: [], employmentType: [] }

export const isEmpty = (f: Filters) => Object.values(f).every((v) => v.length === 0)

export const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

export const toQuery = (f: Filters): PostingFilters =>
  Object.fromEntries(Object.entries(f).filter(([, v]) => v.length > 0)) as PostingFilters

const labelsOf = <K extends string>(list: { key: K; label: string }[], keys: K[]) =>
  list.filter((x) => keys.includes(x.key)).map((x) => x.label)

export const chipText = (key: FilterKey, f: Filters): string => {
  switch (key) {
    case 'category':
      return chipLabel('직군', labelsOf(JOB_CATEGORIES, f.category))
    case 'skills':
      return chipLabel('기술 스택', f.skills)
    case 'careerYears':
      return chipLabel('경력', labelsOf(CAREER_YEARS, f.careerYears))
    case 'location':
      return chipLabel('지역', f.location)
    case 'employmentType':
      return chipLabel('고용형태', labelsOf(EMPLOYMENT_TYPES, f.employmentType))
  }
}

export const SIDOS = ['서울', '경기', '인천', '부산', '대전', '원격'] as const
export const sidoOf = (location: string) => location.split(' ')[0]!

export const toggleRegion = (list: string[], value: string): string[] => {
  if (list.includes(value)) return list.filter((x) => x !== value)
  const sido = sidoOf(value)
  const whole = value === sido
  return [...list.filter((x) => (whole ? sidoOf(x) !== sido : x !== sido)), value]
}

export const formatCount = (n: number) => n.toLocaleString('en-US')
