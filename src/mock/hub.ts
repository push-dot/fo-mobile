// Mock routes for the hub area. Owned by that area's screens.
import type { Offer, Profile } from '@push/api-client'
import { tenureOf } from '../features/hub/utility/filters'
import { searchHangul } from '@/shared/utility'
import { mock, page } from './server'

const base = (p: Pick<Profile, 'userId' | 'displayName' | 'headline' | 'tenureYears' | 'careerStatus'> & Partial<Profile>): Profile => ({
  avatarUrl: null,
  jobCategory: 'dev',
  openToOffers: true,
  intro: '',
  careers: [],
  skills: [],
  followerCount: 0,
  resumeSourceId: null,
  updatedAt: '2026-10-18T09:00:00Z',
  ...p,
})

// Sample people from the Claude Design boards (허브, 프로필 상세, 제안하기).
export const profiles: Profile[] = [
  base({ userId: 'u1', displayName: '김태윤', headline: '결제 시스템을 만드는 백엔드 개발자', tenureYears: 5, careerStatus: 'seeking', skills: ['Kotlin', 'Spring Boot', 'Kafka'], followerCount: 128 }),
  base({
    userId: 'u2',
    displayName: '이하은',
    headline: 'React로 사용자 경험을 다듬어요',
    tenureYears: 4,
    careerStatus: 'seeking',
    intro: '커머스와 SaaS 제품에서 프론트엔드를 맡아 왔어요. 디자인 시스템을 만들고, 느린 화면을 빠르게 바꾸는 일을 좋아해요.',
    careers: [
      { company: '누리클라우드', role: '프론트엔드 개발자', startedOn: '2023-03-01', endedOn: null, description: '관리자 콘솔을 Next.js로 옮기고 디자인 시스템을 만들었어요.' },
      { company: '하루랩스', role: '웹 개발자', startedOn: '2021-07-01', endedOn: '2023-02-28', description: '' },
    ],
    skills: ['React', 'TypeScript', 'Next.js', 'Zustand', 'Storybook'],
    followerCount: 86,
  }),
  base({ userId: 'u3', displayName: '박도윤', headline: 'SwiftUI로 앱을 만드는 iOS 개발자', tenureYears: 3, careerStatus: 'feedback', skills: ['Swift', 'SwiftUI'] }),
  base({ userId: 'u4', displayName: '최지우', headline: '데이터 파이프라인 · Spark · Airflow', tenureYears: 5, careerStatus: 'seeking', skills: ['Spark', 'Airflow', 'Python'] }),
  base({ userId: 'u5', displayName: '정민재', headline: '쿠버네티스 운영이 즐거운 DevOps', tenureYears: 4, careerStatus: 'satisfied', skills: ['Kubernetes', 'AWS'] }),
  base({ userId: 'u6', displayName: '한서연', headline: '실험으로 증명하는 프로덕트 디자이너', jobCategory: 'design', tenureYears: 6, careerStatus: 'seeking', skills: ['Figma'] }),
  base({ userId: 'u7', displayName: '오지훈', headline: '추천 랭킹을 고민하는 데이터 분석가', jobCategory: 'data', tenureYears: 2, careerStatus: 'feedback', skills: ['SQL', 'Python'] }),
  base({ userId: 'u8', displayName: '윤채원', headline: '0→1 서비스를 기획하는 PM', jobCategory: 'plan', tenureYears: 8, careerStatus: 'satisfied' }),
  base({ userId: 'u9', displayName: '강현우', headline: '퍼포먼스 마케팅과 그로스 실험', jobCategory: 'marketing', tenureYears: 3, careerStatus: 'seeking' }),
  base({ userId: 'u10', displayName: '서지민', headline: 'B2B SaaS 세일즈를 이끌어요', jobCategory: 'sales', tenureYears: 11, careerStatus: 'satisfied' }),
  base({ userId: 'u11', displayName: '임도현', headline: 'Go로 트래픽을 견디는 서버를 만들어요', tenureYears: 7, careerStatus: 'seeking', skills: ['Go', 'gRPC'] }),
  base({ userId: 'u12', displayName: '문예린', headline: 'ML 모델을 서비스로 옮기는 엔지니어', jobCategory: 'data', tenureYears: 1, careerStatus: 'seeking', skills: ['PyTorch'] }),
]

const following = new Set<string>(['u2'])
const offers = new Map<string, Offer>()

const csv = (q: URLSearchParams, k: string) => q.get(k)?.split(',').filter(Boolean) ?? []
const notFound = { status: 404, body: { error: { code: 'NOT_FOUND', message: '프로필을 찾지 못했어요.' } } }

mock('GET', 'profiles', ({ query }) => {
  let list = profiles
  const cats = csv(query, 'category')
  if (cats.length) list = list.filter((p) => p.jobCategory && cats.includes(p.jobCategory))
  const tenures = csv(query, 'tenure')
  if (tenures.length) list = list.filter((p) => p.tenureYears != null && tenures.includes(tenureOf(p.tenureYears)))
  const statuses = csv(query, 'status')
  if (statuses.length) list = list.filter((p) => p.careerStatus != null && statuses.includes(p.careerStatus))
  // shortcut: 추천 returns everyone (no "my 직군" in the mock); the real API matches the viewer's category.
  if (query.get('explore') === 'offers') list = list.filter((p) => offers.has(p.userId))
  const q = query.get('q') ?? ''
  if (q) list = searchHangul(list, q, (p) => [p.displayName, p.headline, ...p.skills]).map((r) => r.item)
  return page(list, query)
})

mock('GET', 'profiles/:userId', ({ params }) => {
  const p = profiles.find((x) => x.userId === params.userId)
  if (!p) return notFound
  return { data: { ...p, following: following.has(p.userId), offered: offers.has(p.userId) } }
})

mock('POST', 'profiles/:userId/offer', ({ params, body }) => {
  const p = profiles.find((x) => x.userId === params.userId)
  if (!p) return notFound
  const { message, postingId } = (body ?? {}) as { message?: string; postingId?: string }
  if (!message?.trim() || message.length > 500)
    return { status: 400, body: { error: { code: 'VALIDATION_FAILED', message: '메시지는 1–500자로 써 주세요.' } } }
  if (offers.has(p.userId)) return { status: 409, body: { error: { code: 'CONFLICT', message: '이미 제안을 보냈어요.' } } }
  const offer: Offer = {
    id: `o-${p.userId}`,
    sender: { id: 'me', displayName: '나', avatarUrl: null, companyName: null, headline: '' },
    recipient: { id: p.userId, displayName: p.displayName },
    message,
    // shortcut: posting is not resolved in the mock; postings mock owns that data.
    posting: null,
    status: 'SENT',
    readAt: null,
    createdAt: new Date().toISOString(),
  }
  void postingId
  offers.set(p.userId, offer)
  return { status: 201, body: { data: offer } }
})

mock('POST', 'users/:userId/follow', ({ params }) => void following.add(params.userId!))
mock('DELETE', 'users/:userId/follow', ({ params }) => void following.delete(params.userId!))
