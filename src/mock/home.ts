// Mock routes for the home area (search, notifications). Owned by that area's screens.
import type { AppNotification, Post, Profile } from '@push/api-client'
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
  person({ userId: 'u-jihyun', displayName: '오지현', headline: '모아페이 결제 플랫폼팀 백엔드 리드', tenureYears: 9, skills: ['Kotlin', 'Spring Boot'] }),
  person({ userId: 'u-doyun', displayName: '박도윤', headline: '백엔드 개발자 · Go, gRPC', tenureYears: 5, skills: ['Go'] }),
  person({ userId: 'u-taeyun', displayName: '김태윤', headline: '프론트엔드 개발자 · React', tenureYears: 3, skills: ['React'] }),
  person({ userId: 'u-seoyeon', displayName: '이서연', headline: '데이터 엔지니어 · 추천 시스템', jobCategory: 'data', tenureYears: 4 }),
]

const post = (id: string, name: string, title: string, body: string, category: Post['category']): Post => ({
  id,
  author: { id: `u-${id}`, displayName: name },
  category,
  title,
  body,
  imageUrls: [],
  commentCount: 3,
  viewCount: 120,
  createdAt: '2026-10-18T09:00:00Z',
})
const posts: Post[] = [
  post('s1', '박도윤', '백엔드 3년차, 이직 준비 어떻게 하세요?', '포트폴리오에 어떤 프로젝트를 넣을지 고민이에요.', 'career'),
  post('s2', '오지현', '결제 시스템 백엔드 면접 후기', '정산 배치와 멱등성 질문이 많았어요.', 'dev'),
  post('s3', '이서연', '데이터 엔지니어 커피챗 하실 분', '판교 근처에서 편하게 이야기해요.', 'coffeechat'),
]

mock('GET', 'search', ({ query }) => {
  const q = query.get('q') ?? ''
  const type = query.get('type')
  const hits =
    type === 'people'
      ? searchHangul(people, q, (p) => [p.displayName, p.headline, ...p.skills])
      : type === 'posts'
        ? searchHangul(posts, q, (p) => [p.title, p.body])
        : searchHangul(postings, q, (p) => [p.title, p.company])
  return page(hits.map((h) => h.item), query)
})

const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString()
const notifications: AppNotification[] = [
  { id: 'n1', type: 'AI_DONE', title: 'AI 작업 완료', body: '모아페이 맞춤 이력서를 다 만들었어요. 적합도 6.9 → 8.4', target: { kind: 'conversation', id: 'c1' }, readAt: null, createdAt: ago(10) },
  { id: 'n2', type: 'OFFER', title: '제안 받음', body: '오지현 님이 결제 플랫폼팀 커피챗을 제안했어요.', target: { kind: 'offer', id: 'o1' }, readAt: null, createdAt: ago(120) },
  { id: 'n3', type: 'DEADLINE', title: '마감 임박', body: '북마크한 파도AI 데이터 분석가 공고가 2일 남았어요.', target: { kind: 'posting', id: 'p2' }, readAt: null, createdAt: ago(180) },
  { id: 'n4', type: 'COMMENT', title: '댓글과 답글', body: '박도윤 님이 내 글에 답글을 남겼어요. “저도 같은 고민이었어요!”', target: { kind: 'post', id: 's1' }, readAt: ago(60 * 20), createdAt: ago(60 * 26) },
  { id: 'n5', type: 'DEADLINE', title: '마감 임박', body: '도토리증권 서버 개발자 (Go) 공고가 3일 남았어요.', target: { kind: 'posting', id: 'p3' }, readAt: ago(60 * 48), createdAt: ago(60 * 72) },
  { id: 'n6', type: 'AI_DONE', title: 'AI 작업 완료', body: '도토리증권 공고 갭 분석을 마쳤어요. 적합도 7.8', target: { kind: 'conversation', id: 'c2' }, readAt: ago(60 * 90), createdAt: ago(60 * 96) },
]

mock('GET', 'me/notifications', ({ query }) => page(notifications, query))
mock('POST', 'me/notifications/read', ({ body }) => {
  const b = (body ?? {}) as { all?: boolean; ids?: string[] }
  const now = new Date().toISOString()
  for (const n of notifications) if (!n.readAt && (b.all || b.ids?.includes(n.id))) n.readAt = now
})
