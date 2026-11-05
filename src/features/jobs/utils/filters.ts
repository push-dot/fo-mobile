import {
  CAREER_YEARS, EMPLOYMENT_TYPES, JOB_CATEGORIES,
  type CareerYears, type EmploymentType, type JobCategory, type PostingFilters,
} from '@push/api-client'
import { FILTER_TITLES } from '../constants'

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
  const selected =
    key === 'category'
      ? labelsOf(JOB_CATEGORIES, f.category)
      : key === 'skills'
        ? f.skills
        : key === 'careerYears'
          ? labelsOf(CAREER_YEARS, f.careerYears)
          : key === 'location'
            ? f.location
            : labelsOf(EMPLOYMENT_TYPES, f.employmentType)
  if (selected.length === 0) return FILTER_TITLES[key]
  if (selected.length === 1) return `${FILTER_TITLES[key]} · ${selected[0]}`
  return `${selected[0]} 외 ${selected.length - 1}`
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
