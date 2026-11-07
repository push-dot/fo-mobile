import type { PostingSort, SectionKind } from './types'
import type { FilterKey } from './utils'

export const POSTING_PAGE_LIMIT = 20
export const CARD_RADIUS = 20
export const GRID_SKELETON_CARDS = 4
export const JOBS_EMPTY_LINES = ['조건에 맞는 공고가 없어요.', '필터를 줄여 보세요.'] as const
export const RESET_FILTERS_LABEL = '필터 초기화'

export const FILTER_KEYS: FilterKey[] = ['category', 'skills', 'careerYears', 'location', 'employmentType']

export const LONG_FILTER_KINDS: FilterKey[] = ['skills', 'location']
/** The region picker is drawn as a full-height sheet (FilterRegion). */
export const FULL_SHEET_KIND: FilterKey = 'location'

export const POSTING_SORTS: { key: PostingSort; label: string }[] = [
  { key: 'latest', label: '최신순' },
  { key: 'deadline', label: '마감 임박순' },
  { key: 'popular', label: '인기순' },
]

export const FILTER_TITLES: Record<FilterKey, string> = {
  category: '직군',
  skills: '기술 스택',
  careerYears: '경력',
  location: '지역',
  employmentType: '고용형태',
}

export const POPULAR_SKILL_COUNT = 5

// shortcut: fixed catalog for 기술 검색; switch to a skills endpoint once push-be has one.
export const SKILL_CATALOG = [
  'Java', 'Kotlin', 'Spring Boot', 'JPA', 'MySQL', 'PostgreSQL', 'Redis', 'Kafka', 'AWS', 'Kubernetes', 'Docker',
  'Go', 'gRPC', 'Node.js', 'TypeScript', 'JavaScript', 'React', 'Vue', 'Next.js', 'Swift', 'SwiftUI', 'Android',
  'Python', 'PyTorch', 'SQL', 'C++', 'Figma',
]

export const SECTIONS: Record<SectionKind, { title: string; description: string }> = {
  latest: { title: '새로 올라온 공고', description: '최근에 올라온 공고부터 보여드려요' },
  deadline: { title: '마감 임박 공고', description: '일주일 안에 마감되는 공고예요' },
  popular: { title: '이번 주 많이 본 공고', description: '이번 주에 사람들이 많이 본 공고예요' },
}

export const APPLY_DOC_NOTE = { ai: '에이전트로 맞춘 서류', upload: '원본' } as const

export const APPLY_DOC_LIMIT = 100
