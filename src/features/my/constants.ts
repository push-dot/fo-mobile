import type { Settings, Tone } from '@push/api-client'
import { TOAST_MS } from '@/shared/components/constants'
import type { CalendarEventType } from './types'

export const MIN = 60_000
export const HOUR = 60 * MIN
export const DAY = 24 * HOUR
export const SHEET_SWAP_MS = 400
export const UNDO_MS = TOAST_MS.action
export const PUSH_CARD_WIDTH = 242
export const NEXT_EVENT_DAYS = 90
export const FOLLOW_PREVIEW = 5
export const POST_PREVIEW = 4

// Person avatar size -> initials font size on the boards; not a ratio (36/13 but 48/15).
export const AVATAR_TEXT: Record<number, number> = { 36: 13, 44: 14, 48: 15, 56: 18, 64: 20, 84: 26 }

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export const EVENT_TYPES: { key: CalendarEventType; label: string }[] = [
  { key: 'INTERVIEW', label: '면접' },
  { key: 'DEADLINE', label: '마감' },
  { key: 'FOLLOW_UP', label: '후속 연락' },
  { key: 'COFFEE_CHAT', label: '커피챗' },
  { key: 'CUSTOM', label: '직접 추가' },
]

// shortcut: static list; replace with a skills endpoint if push-be adds one.
export const SKILL_CATALOG = [
  'Java',
  'Kotlin',
  'Spring Boot',
  'Spring Batch',
  'JPA',
  'QueryDSL',
  'MySQL',
  'PostgreSQL',
  'Oracle',
  'MongoDB',
  'Redis',
  'Elasticsearch',
  'Kafka',
  'RabbitMQ',
  'gRPC',
  'GraphQL',
  'Rest Docs',
  'Go',
  'Python',
  'Django',
  'FastAPI',
  'Node.js',
  'NestJS',
  'TypeScript',
  'JavaScript',
  'React',
  'React Native',
  'Next.js',
  'Vue.js',
  'Swift',
  'SwiftUI',
  'Android',
  'Flutter',
  'AWS',
  'GCP',
  'Azure',
  'Docker',
  'Kubernetes',
  'Terraform',
  'Jenkins',
  'GitHub Actions',
  'Airflow',
  'Spark',
  'Hadoop',
  'SQL',
  'PyTorch',
  'TensorFlow',
  'Figma',
  '데이터 분석',
  '부하 테스트',
]

export const DOC_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export const AVATAR_IMAGE_OPTIONS = {
  mediaTypes: ['images' as const],
  allowsEditing: true,
  aspect: [1, 1] as [number, number],
  quality: 0.8,
}

export const RESUME_DOCUMENT_OPTIONS = { type: DOC_TYPES, copyToCacheDirectory: true }
export const MAX_BYTES = 20 * 1024 * 1024

export const TONES: { key: Tone; label: string }[] = [
  { key: 'as_is', label: '그대로' },
  { key: 'professional', label: '전문적인' },
  { key: 'confident', label: '자신감 있는' },
  { key: 'concise', label: '간결한' },
  { key: 'technical', label: '기술 중심' },
  { key: 'friendly', label: '친근한' },
]
export const CONTACT: { key: Settings['contactVisibility']; label: string }[] = [
  { key: 'accepted', label: '제안 수락한 사람만' },
  { key: 'everyone', label: '모두에게' },
]
export const VISIBILITY: {
  key: Settings['careerStatusVisibility']
  label: string
  sub: (followers: number) => string
}[] = [
  { key: 'everyone', label: '모두에게', sub: () => 'Push를 쓰는 모든 사람' },
  { key: 'followers', label: '팔로워에게만', sub: (n) => `나를 팔로우한 사람 ${n}명` },
  { key: 'private', label: '나만 보기', sub: () => '허브 목록과 필터에서도 빠져요' },
]
export const LANGS: { key: Settings['locale']; label: string }[] = [
  { key: 'ko', label: '한국어' },
  { key: 'en', label: 'English' },
]
export const SETTINGS_PICKS = {
  contact: { field: 'contactVisibility', title: '누구에게 연락처를 보여 줄까요?', items: CONTACT },
  tone: { field: 'defaultTone', title: '에이전트가 어떤 말투로 쓸까요?', items: TONES },
} as const satisfies Record<string, { field: keyof Settings; title: string; items: { key: string; label: string }[] }>
export type SettingsPickKind = keyof typeof SETTINGS_PICKS
export const NOTIFY_SUB: Partial<Record<keyof Settings, string>> = {
  notifyDeadline: '북마크한 공고 마감 3일 전',
  notifyAiDone: '앱을 닫아도 끝나면 알려 드려요',
}
export const LOGIN_LABEL: Record<string, string> = {
  google: 'Google 계정으로 로그인',
  apple: 'Apple 계정으로 로그인',
  github: 'GitHub 계정으로 로그인',
  phone: '전화번호로 로그인',
  email: '이메일로 로그인',
}

export const INGEST_TEXT = { reading: '읽는 중', failed: '읽지 못했어요' } as const

/** Profile header spacing from the 마이 / 지원 서류용 프로필 boards: name margin-top 6, action buttons margin-top 10. */
export const PROFILE_NAME_TOP = 6
export const PROFILE_ACTIONS_TOP = 10
