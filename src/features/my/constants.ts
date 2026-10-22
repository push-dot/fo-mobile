import type { Settings, Tone } from '@push/api-client'

export const MIN = 60_000
export const HOUR = 60 * MIN
export const DAY = 24 * HOUR

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export const TINTS = ['#3B5BDB', '#0C8599', '#5F3DC4', '#E8590C', '#2F9E44', '#1F3A8A', '#C2255C', '#1864AB']

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
export const MAX_BYTES = 20 * 1024 * 1024

export const TONES: { key: Tone; label: string }[] = [
  { key: 'as_is', label: '그대로' },
  { key: 'professional', label: '전문적인' },
  { key: 'confident', label: '자신감 있는' },
  { key: 'concise', label: '간결한' },
  { key: 'technical', label: '기술 중심' },
  { key: 'friendly', label: '친근한' },
]
// shortcut: plan limits (FREE 7일 · PRO 30일 · ULTRA 무제한) aren't exposed yet, so every option is offered and push-be
// rejects the ones over the plan; 0 here is push-be's null (무제한).
export const RETENTION = [7, 30, 90, 0].map((d) => ({ key: d, label: d ? `${d}일` : '무제한' }))
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
// shortcut: Session has no login provider yet; show it from the session once push-be returns it.
export const LOGIN_LABEL = 'Google 계정으로 로그인'

export const INGEST_TEXT = { reading: '읽는 중', failed: '읽지 못했어요' } as const
