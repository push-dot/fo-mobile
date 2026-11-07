// Mock routes for the home area (search, notifications). Owned by that area's screens.
import type { AppNotification, Post, Posting, Profile } from '@push/api-client'
import { searchHangul } from '@push/shared'
import { postings } from './postings'
import { mock, page } from './server'

// Search-only samples; hub/social own their full fixtures.
const person = (p: Pick<Profile, 'userId' | 'displayName' | 'headline' | 'tenureYears'> & Partial<Profile>): Profile => ({
  avatarUrl: null,
  jobCategory: 'dev',
  careerStatus: 'seeking',
  openToOffers: true,
  intro: '',
  careers: [],
  skills: [],
  followerCount: 0,
  resumeSourceId: null,
  updatedAt: '2026-10-19T09:00:00Z',
  ...p,
})
const people: Profile[] = [
  person({ userId: 'u1', displayName: '김태윤', headline: '결제 시스템을 만드는 백엔드 개발자', tenureYears: 5, skills: ['Kotlin'] }),
  person({ userId: 'u-subin', displayName: '이수빈', headline: '3년차 백엔드 · Node.js', tenureYears: 3, skills: ['Node.js'] }),
  person({ userId: 'u-hyunwoo', displayName: '윤현우', headline: '백엔드 · 대용량 트래픽 경험', tenureYears: 7 }),
  person({ userId: 'u4', displayName: '최지우', headline: '데이터 파이프라인 · 백엔드 협업', tenureYears: 5, skills: ['Spark'] }),
  person({ userId: 'u-jihyun', displayName: '오지현', headline: '모아페이 결제 플랫폼팀 백엔드 리드', tenureYears: 9, skills: ['Kotlin', 'Spring Boot'] }),
  person({ userId: 'u-doyun', displayName: '박도윤', headline: '백엔드 개발자 · Go, gRPC', tenureYears: 5, skills: ['Go'] }),
  person({ userId: 'u-seoyeon', displayName: '이서연', headline: '데이터 엔지니어 · 추천 시스템', jobCategory: 'data', tenureYears: 4 }),
]

const post = (id: string, name: string, title: string, body: string, category: Post['category'], commentCount: number, createdAt: string): Post => ({
  id,
  author: { id: `u-${id}`, displayName: name },
  category,
  title,
  body,
  imageUrls: [],
  commentCount,
  viewCount: 120,
  createdAt,
})
const posts: Post[] = [
  post('post-1', '이수빈', '3년차 백엔드, 이직 타이밍 고민돼요', '지금 회사에서 배울 건 다 배운 느낌인데, 연봉 협상 시즌까지 기다리는 게 나을까요?', 'career', 24, new Date(Date.now() - 2 * 3600_000).toISOString()),
  post('s2', '김서준', '결제 승인 API p95를 절반 아래로 줄인 이야기', '백엔드 팀에서 승인 API의 병목을 찾아 p95를 절반 아래로 줄인 과정을 정리했어요.', 'dev', 31, '2026-10-09T09:00:00Z'),
  post('s3', '윤현우', '백엔드 면접에서 자주 받은 질문 정리', '트랜잭션과 인덱스 질문이 가장 많았어요.', 'dev', 57, '2026-10-02T09:00:00Z'),
  post('s4', '강민호', '프론트에서 백엔드로 옮긴 1년 회고', '직무를 옮기며 배운 것들을 적어 봤어요.', 'work', 19, '2026-09-28T09:00:00Z'),
  post('s5', '박도윤', '백엔드 3년차, 이직 준비 어떻게 하세요?', '포트폴리오에 어떤 프로젝트를 넣을지 고민이에요.', 'career', 3, '2026-09-20T09:00:00Z'),
  post('s6', '오지현', '결제 시스템 백엔드 면접 후기', '정산 배치와 멱등성 질문이 많았어요.', 'dev', 8, '2026-09-15T09:00:00Z'),
  post('s7', '이서연', '데이터 엔지니어 커피챗 하실 분', '판교 근처에서 편하게 이야기해요.', 'coffeechat', 2, '2026-09-10T09:00:00Z'),
]

// shortcut: the design's search boards show 공고 24 · 사람 8 · 게시글 13 for ‘백엔드’ in a fixed order; the fixtures are fewer,
// so this query reports those totals and returns only the drawn rows.
const BOARD_QUERY = '백엔드'
const BOARD_TOTALS = { postings: 24, people: 8, posts: 13 }
const BOARD_ORDER = {
  postings: ['p1', 'p9', 'p10', 'p3', 'p11', 'p12'],
  people: ['u1', 'u-subin', 'u-hyunwoo', 'u4'],
  posts: ['post-1', 's2', 's3', 's4'],
}
const onlyOrdered = <T,>(items: T[], idOf: (t: T) => string, order: string[]) => order.flatMap((id) => items.filter((t) => idOf(t) === id))
// The board draws 도토리증권 as 서버·백엔드 under ‘백엔드’; the other boards show the plain title.
const BOARD_TITLES: Record<string, string> = { p3: '서버·백엔드 개발자 (Go)' }

mock('GET', 'search', ({ query }) => {
  const q = query.get('q') ?? ''
  const type = query.get('type') === 'people' ? 'people' : query.get('type') === 'posts' ? 'posts' : 'postings'
  const board = q.trim() === BOARD_QUERY
  const rank = <T,>(items: T[], fields: (t: T) => string[], idOf: (t: T) => string) => {
    const found = searchHangul(items, q, fields).map((h) => h.item)
    return board ? onlyOrdered(found, idOf, BOARD_ORDER[type]) : found
  }
  const hits =
    type === 'people'
      ? rank(people, (p) => [p.displayName, p.headline, ...p.skills], (p) => p.userId)
      : type === 'posts'
        ? rank(posts, (p) => [p.title, p.body], (p) => p.id)
        : rank(board ? postings.map((p) => ({ ...p, title: BOARD_TITLES[p.id] ?? p.title })) : postings, (p) => [p.title, p.company], (p) => p.id)
  const out = page<Posting | Profile | Post>(hits, query, true)
  return { ...out, page: { ...out.page, total: board ? BOARD_TOTALS[type] : hits.length } }
})

mock('GET', 'search/trending', () => ({
  data: {
    terms: ['프론트엔드', 'React', '신입 개발자', 'AI 엔지니어', 'PM', '재택 근무', 'Go', '데이터 분석'].map((term, i) => ({ term, count: 80 - i * 7 })),
    skills: ['React', 'TypeScript', 'Python', 'Go', 'Kubernetes'].map((id, i) => ({ id, count: 120 - i * 11 })),
  },
}))

// Today's rows are clamped to the start of the day so a run just after midnight still lands them under 오늘.
const startOfToday = new Date().setHours(0, 0, 0, 0)
const today = (minutesAgo: number) => new Date(Math.max(startOfToday, Date.now() - minutesAgo * 60_000)).toISOString()
const daysAgo = (n: number, hour: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}
const READ = daysAgo(0, 0)
const morning = () => new Date(Math.max(startOfToday, Math.min(new Date().setHours(9, 0, 0, 0), Date.now() - 181 * 60_000))).toISOString()
const notifications: AppNotification[] = [
  { id: 'n1', type: 'APPLICATION_STAGE', title: '지원 상태가 바뀌었어요', body: '모아페이 백엔드 엔지니어 · 면접 진행 중', target: { kind: 'activity', id: 'a1' }, readAt: null, createdAt: today(0) },
  { id: 'n2', type: 'AI_DONE', title: '에이전트 작업 완료', body: '모아페이 맞춤 이력서를 다 만들었어요. 적합도 6.9 → 8.1', target: { kind: 'conversation', id: 'c1' }, readAt: null, createdAt: today(10) },
  { id: 'n3', type: 'OFFER', title: '제안 받음', body: '오지현 님이 결제 플랫폼팀 커피챗을 제안했어요.', target: { kind: 'offer', id: 'o1' }, readAt: null, createdAt: today(120) },
  { id: 'n4', type: 'DEADLINE', title: '마감 임박 공고', body: '북마크한 파도AI 데이터 분석가 공고가 2일 남았어요.', target: { kind: 'posting', id: 'p2' }, readAt: READ, createdAt: morning() },
  { id: 'n5', type: 'COMMENT', title: '댓글과 답글', body: '박도윤 님이 내 글에 답글을 남겼어요. “저도 같은 고민이었어요!”', target: { kind: 'post', id: 'post-1' }, readAt: READ, createdAt: daysAgo(1, 15) },
  { id: 'n6', type: 'DEADLINE', title: '마감 임박 공고', body: '도토리증권 서버 개발자 (Go) 공고가 3일 남았어요.', target: { kind: 'posting', id: 'p3' }, readAt: READ, createdAt: daysAgo(3, 10) },
  { id: 'n7', type: 'AI_DONE', title: '에이전트 작업 완료', body: '도토리증권 공고 갭 분석을 마쳤어요. 적합도 7.8', target: { kind: 'conversation', id: 'c2' }, readAt: READ, createdAt: daysAgo(4, 18) },
  { id: 'n8', type: 'OFFER', title: '제안 받음', body: '한지민 님이 정산팀 채용 제안을 보냈어요.', target: { kind: 'offer', id: 'o2' }, readAt: READ, createdAt: daysAgo(12, 11) },
]

// Tour switch (links.ts): the Notifications board draws the 마감 임박 row unread while the home bell still reads 3, so only that tour asks for it.
export const unreadDeadline = () => {
  const n = notifications.find((x) => x.id === 'n4')
  if (n) n.readAt = null
}

mock('GET', 'me/notifications', ({ query }) => page(notifications, query))
mock('POST', 'me/notifications/read', ({ body }) => {
  const b = (body ?? {}) as { all?: boolean; ids?: string[] }
  const now = new Date().toISOString()
  for (const n of notifications) if (!n.readAt && (b.all || b.ids?.includes(n.id))) n.readAt = now
  // shortcut: NotificationsStates draws the box after 모두 읽음 with no 오늘 group, so reading all drops today's rows (a server would keep them); revisit if a flow reads all and expects them.
  if (b.all) notifications.splice(0, notifications.length, ...notifications.filter((n) => n.createdAt < new Date(startOfToday).toISOString()))
})

// Phone sign-in. The code's tail picks the outcome so the boards' error states can be reached: 482111 wrong, 482222 expired,
// 482333 too many tries, anything else signs in a new user (who then lands on the terms screen).
const authError = (status: number, code: string, message: string) => ({ status, body: { error: { code, message } } })
mock('POST', 'auth/phone/send', () => ({ data: { cooldownSeconds: 170, expiresAt: new Date(Date.now() + 180_000).toISOString() } }))
mock('POST', 'auth/phone/verify', ({ body }) => {
  const code = (body as { code?: string } | undefined)?.code
  if (code === '482111') return authError(400, 'PHONE_CODE_INVALID', 'invalid code')
  if (code === '482222') return authError(400, 'PHONE_CODE_EXPIRED', 'expired code')
  if (code === '482333') return authError(429, 'RATE_LIMITED', 'too many attempts')
  return { data: { accessToken: 'mock-phone-token', refreshToken: '', expiresIn: 3600, user: { id: 'me', displayName: '김서준', locale: 'ko' }, created: true } }
})
