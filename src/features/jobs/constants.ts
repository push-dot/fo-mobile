import type { SectionKind } from './types'
import type { FilterKey } from './utility'

export const POSTING_PAGE_LIMIT = 20

export const FILTER_KEYS: FilterKey[] = ['category', 'skills', 'careerYears', 'location', 'employmentType']

export const FILTER_TITLES: Record<FilterKey, string> = {
  category: '직군',
  skills: '기술 스택',
  careerYears: '경력',
  location: '지역',
  employmentType: '고용형태',
}

export const POPULAR_SKILLS = ['React', 'TypeScript', 'Python', 'Go', 'Kubernetes']

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

export const APPLY_DOC_NOTE = { ai: 'AI로 맞춘 서류', upload: '원본' } as const

export const APPLY_DOC_LIMIT = 100
