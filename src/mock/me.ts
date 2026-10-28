// Mock routes for the me area (마이). Sample data from the 마이 / 제안함 / 설정 boards.
// me/bookmarks and me/notifications are registered by other areas.
import type {
  Application,
  Offer,
  OfferMessage,
  Post,
  OfferPosting,
  Profile,
  Settings,
  Source,
  UserRef,
} from '@push/api-client'
import type { CalendarEvent, ResumeDraft } from '@/features/my'
import { mock, page } from './server'

const ME: UserRef = { id: 'me', displayName: '김서준', avatarUrl: null }
const ME_SENDER: Offer['sender'] = { ...ME, avatarUrl: null, companyName: null, headline: '' }
const ago = (ms: number) => new Date(Date.now() - ms).toISOString()
const H = 3_600_000
const D = 24 * H
const on = (m: number, d: number, h = 9, min = 0) => new Date(2026, m - 1, d, h, min).toISOString()

let profile: Profile = {
  userId: 'me',
  displayName: '김서준',
  avatarUrl: null,
  headline: '결제 시스템을 만드는 백엔드 개발자',
  jobCategory: 'dev',
  tenureYears: 4,
  careerStatus: 'seeking',
  openToOffers: true,
  intro:
    '4년 동안 결제·정산 시스템을 설계하고 운영했어요. 트래픽이 몰리는 기간에도 장애 없는 결제를 만드는 데 집중해 왔어요.\n\n요즘은 Kafka 기반 이벤트 처리와 부하 테스트에 관심이 많아요.',
  careers: [
    {
      company: '모아페이',
      role: '백엔드 엔지니어',
      startedOn: '2022-03',
      endedOn: null,
      description: '결제 승인 API와 정산 배치를 맡고 있어요.',
    },
    {
      company: '하루랩스',
      role: '서버 개발자',
      startedOn: '2021-01',
      endedOn: '2022-02',
      description: '',
    },
  ],
  skills: ['Kotlin', 'Spring Boot', 'JPA', 'MySQL', 'Kafka', 'AWS'],
  followerCount: 12,
  resumeSourceId: 's1',
  updatedAt: ago(D),
}

mock('GET', 'me/profile', () => ({ data: profile }))
mock('PATCH', 'me/profile', ({ body }) => {
  const { avatarKey, ...patch } = body as Partial<Profile> & { avatarKey?: string }
  profile = {
    ...profile,
    ...patch,
    ...(avatarKey ? { avatarUrl: `https://picsum.photos/seed/${avatarKey}/200` } : {}),
    updatedAt: new Date().toISOString(),
  }
  return { data: profile }
})

// 서류 (sources)
const src = (id: string, fileName: string, size: number, createdAt: string): Source => ({
  id,
  fileName,
  mimeType: fileName.endsWith('.pdf')
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  size,
  sha256: id,
  status: 'READY',
  createdAt,
})
let sources: Source[] = [
  src('s1', '김서준_백엔드_이력서_2026.pdf', 2_400_000, on(10, 12)),
  src('s2', '경력기술서_모아페이.docx', 640_000, on(9, 28)),
  src('s3', '포트폴리오_결제시스템.pdf', 8_100_000, on(8, 3)),
]

mock('GET', 'sources', ({ query }) => page(sources, query))
mock('GET', 'sources/:id', ({ params }) => {
  const s = sources.find((x) => x.id === params.id)
  return s
    ? { data: s }
    : { status: 404, body: { error: { code: 'NOT_FOUND', message: '서류를 찾지 못했어요' } } }
})
mock('DELETE', 'sources/:id', ({ params }) => {
  sources = sources.filter((x) => x.id !== params.id)
})
mock('POST', 'sources', async ({ body }) => {
  // RN FormData keeps the appended file object (uri, name, type, size) in getParts().
  const parts =
    (
      body as {
        getParts?: () => { name?: string; type?: string; size?: number; fieldName?: string }[]
      }
    )?.getParts?.() ?? []
  const file = parts.find((p) => p.fieldName === 'file') ?? parts[0]
  await new Promise((r) => setTimeout(r, 1800))
  const s = src(
    `s${Date.now()}`,
    file?.name ?? '새 서류.pdf',
    file?.size ?? 1_800_000,
    new Date().toISOString(),
  )
  sources = [s, ...sources]
  return { data: s }
})

const draft: ResumeDraft = {
  pageCount: 2,
  email: 'seojun.kim@example.com',
  links: ['github.com/seojun'],
  profile: {
    displayName: '김서준',
    headline: '결제 시스템을 만드는 4년차 백엔드 개발자',
    jobCategory: 'dev',
    tenureYears: 4,
    intro:
      '결제 시스템을 만드는 4년차 백엔드 개발자예요. 트래픽이 몰리는 기간에도 멈추지 않는 결제를 만드는 데 집중해 왔어요.',
    careers: [
      {
        company: '모아페이',
        role: '백엔드 엔지니어',
        startedOn: '2022-03',
        endedOn: null,
        description:
          '결제 승인 API를 다시 설계해 p99 지연을 420ms에서 180ms로 줄였어요. Kafka로 승인 이벤트를 분리해 하루 280만 건을 처리했어요.',
      },
      {
        company: '하루랩스',
        role: '서버 개발자',
        startedOn: '2021-01',
        endedOn: '2022-02',
        description: '',
      },
    ],
    skills: ['Kotlin', 'Java', 'Spring Boot', 'JPA', 'MySQL', 'Kafka', 'Redis'],
  },
}
mock('GET', 'sources/:id/profile-draft', () => ({ data: draft }))

// 지원활동
const app = (
  id: string,
  jobId: string,
  company: string,
  title: string,
  stage: Application['stage'],
  at: string,
): Application => ({
  id,
  revision: 1,
  jobId,
  company,
  title,
  stage,
  appliedAt: at,
  createdAt: at,
})
const applications: Application[] = [
  app('a1', 'p1', '모아페이', '백엔드 엔지니어 (Kotlin·Spring)', 'INTERVIEW', on(10, 14)),
  app('a2', 'p3', '도토리증권', '서버 개발자 (Go)', 'SCREENING', on(10, 10)),
  app('a3', 'p8', '별빛게임즈', 'DevOps 엔지니어', 'APPLIED', on(10, 16)),
  app('a4', 'p7', '라온헬스', '백엔드 개발자 (Java)', 'ACCEPTED', on(9, 22)),
  app('a5', 'p6', '새벽마켓', '결제 플랫폼 엔지니어', 'REJECTED', on(9, 8)),
]
mock('GET', 'applications', ({ query }) => page(applications, query))

// 캘린더 (local route until push-be /calendar is wired)
const ev = (
  id: string,
  type: CalendarEvent['type'],
  title: string,
  startsAt: string,
  extra: Partial<CalendarEvent> = {},
): CalendarEvent => ({
  id,
  type,
  title,
  startsAt,
  endsAt: null,
  notes: '',
  ...extra,
})
const events: CalendarEvent[] = [
  ev('e1', 'FOLLOW_UP', '라온헬스 후속 연락', on(10, 2, 11)),
  ev('e2', 'INTERVIEW', '도토리증권 기술 면접', on(10, 8, 14)),
  ev('e3', 'DEADLINE', '도토리증권 서버 개발자', on(10, 15, 23, 59), {
    notes: '서류 확정이 필요해요',
  }),
  ev('e4', 'CUSTOM', '포트폴리오 정리', on(10, 16, 20)),
  ev('e5', 'INTERVIEW', '모아페이 결제 플랫폼팀 1차 면접', on(10, 21, 15), {
    endsAt: on(10, 21, 16),
    notes: 'Google Meet',
  }),
  ev('e6', 'DEADLINE', '파도AI 데이터 분석가', on(10, 22, 23, 59), {
    notes: '서류 확정이 필요해요',
  }),
  ev('e7', 'COFFEE_CHAT', '최지우 님과 커피챗', on(10, 23, 12, 30), {
    endsAt: on(10, 23, 13),
    notes: '강남역',
  }),
  ev('e8', 'DEADLINE', '그린티켓 그로스 마케터', on(10, 24, 23, 59)),
  ev('e9', 'FOLLOW_UP', '도토리증권 결과 확인', on(10, 27, 10)),
  ev('e10', 'INTERVIEW', '별빛게임즈 1차 면접', on(10, 29, 16), {
    endsAt: on(10, 29, 17),
    notes: '판교 오피스',
  }),
  ev('e11', 'CUSTOM', '부하 테스트 스터디', on(10, 29, 20)),
  ev('e12', 'FOLLOW_UP', '모아페이 면접 후기 보내기', on(10, 30, 10)),
]
mock('GET', 'calendar/events', ({ query }) => {
  const from = query.get('from') ?? ''
  const to = query.get('to') ?? '9999'
  return page(events.filter((e) => e.startsAt >= from && e.startsAt < to), query)
})
mock('GET', 'integrations/google', () => ({ data: { enabled: true, connected: true, calendarStatus: 'CONNECTED' } }))
mock('POST', 'calendar/events', ({ body }) => {
  const e = ev(
    `e${Date.now()}`,
    'CUSTOM',
    '',
    new Date().toISOString(),
    body as Partial<CalendarEvent>,
  )
  events.push(e)
  return { data: e }
})

// 팔로우
const person = (userId: string, displayName: string, headline: string): Profile => ({
  ...profile,
  userId,
  displayName,
  headline,
  intro: '',
  careers: [],
  skills: [],
  resumeSourceId: null,
  following: true,
})
const follows = [
  person('u-haeun', '이하은', 'React로 사용자 경험을 다듬어요'),
  person('u-taeyun', '김태윤', '결제 시스템을 만드는 백엔드 개발자'),
  person('u-jiwoo', '최지우', '데이터 파이프라인 · Spark · Airflow'),
  person('u-doyun', '박도윤', 'SwiftUI로 앱을 만드는 iOS 개발자'),
  person('u-minjae', '정민재', '쿠버네티스 운영이 즐거운 DevOps'),
]
const followers = [
  { ...follows[0]!, following: true },
  { ...person('u-jihyun', '오지현', '모아페이 결제 플랫폼팀 채용 담당'), following: false },
  { ...follows[2]!, following: true },
]
mock('GET', 'me/follows', ({ query }) => page(follows, query))
mock('GET', 'me/followers', ({ query }) => page(followers, query))

// 게시글
const post = (
  id: string,
  category: Post['category'],
  title: string,
  commentCount: number,
  viewCount: number,
  createdAt: string,
  author = ME,
): Post => ({
  id,
  author,
  category,
  title,
  body: '',
  imageUrls: [],
  commentCount,
  viewCount,
  createdAt,
})
const myPosts = [
  post('mp1', 'career', '연봉 협상 전에 정리하면 좋은 것들', 18, 412, ago(D + 2 * H)),
  post('mp2', 'dev', '결제 승인 API p99를 절반으로 줄인 이야기', 31, 1204, on(10, 9)),
  post('mp3', 'work', '4년차 백엔드, 사이드 프로젝트 어떻게 하세요?', 24, 388, on(9, 21)),
]
const commented = [
  post('cp1', 'dev', 'Kafka 컨슈머 랙, 다들 어떻게 모니터링하세요?', 42, 2310, ago(3 * H), {
    id: 'u-minjae',
    displayName: '정민재',
  }),
  post('cp2', 'coffeechat', '판교 근처 백엔드 커피챗 하실 분', 12, 530, on(10, 11), {
    id: 'u-taeyun',
    displayName: '김태윤',
  }),
]
mock('GET', 'me/posts', ({ query }) => page(myPosts, query))
mock('GET', 'me/commented-posts', ({ query }) => page(commented, query))

// 제안함
// push-be embeds only a posting stub in offers.
const offerPosting: OfferPosting = { id: 'p1', company: '모아페이', title: '백엔드 엔지니어 (Kotlin·Spring) · 결제 플랫폼팀', imageUrl: null }
const user = (id: string, displayName: string, companyName: string, headline: string) => ({
  id,
  displayName,
  avatarUrl: null,
  companyName,
  headline,
})
const offer = (
  o: Pick<Offer, 'id' | 'sender' | 'recipient' | 'message' | 'status' | 'createdAt'> &
    Partial<Offer>,
): Offer => ({
  posting: null,
  readAt: o.status === 'SENT' ? null : o.createdAt,
  ...o,
})
const received: Offer[] = [
  offer({
    id: 'o1',
    sender: user('u-jihyun', '오지현', '모아페이', '결제 플랫폼팀 채용 담당'),
    recipient: ME,
    message:
      '서준 님, 안녕하세요! 허브에서 프로필 보고 연락드려요.\n\n결제 승인 API를 다시 설계하신 경험이 지금 저희 결제 플랫폼팀의 고민과 딱 맞아서요. 시니어 포지션으로 30분 정도 가볍게 커피챗 어떠세요?',
    posting: offerPosting,
    status: 'SENT',
    createdAt: ago(2 * H),
  }),
  offer({
    id: 'o2',
    sender: user('u-doyun', '박도윤', '하루랩스', 'iOS 개발자'),
    recipient: ME,
    message:
      '주말 사이드 프로젝트를 같이 하실 백엔드 개발자를 찾고 있어요. 정산 쪽 경험이 있으시면 큰 도움이 될 것 같아요.',
    status: 'SENT',
    createdAt: ago(D + 3 * H),
  }),
  offer({
    id: 'o3',
    sender: user('u-jiwoo', '최지우', '파도AI', '데이터 엔지니어'),
    recipient: ME,
    message: '정산 데이터 파이프라인 경험을 듣고 싶어요. 30분 정도 이야기 나눌 수 있을까요?',
    status: 'ACCEPTED',
    createdAt: on(10, 14, 10),
  }),
  offer({
    id: 'o4',
    sender: user('u-greenticket', '그린티켓 채용팀', '그린티켓', '서버 개발자 포지션'),
    recipient: ME,
    message: '서버 개발자 포지션에 관심 있으시면 이야기 나눠 보고 싶어요.',
    status: 'DECLINED',
    createdAt: on(10, 2, 15),
  }),
]
const sent: Offer[] = [
  offer({
    id: 'o5',
    sender: ME_SENDER,
    recipient: user('u-haeun', '이하은', '누리클라우드', '프론트엔드 개발자'),
    message: '디자인 시스템 경험이 인상 깊어서 커피챗 제안드려요.',
    status: 'SENT',
    createdAt: ago(D + 5 * H),
  }),
  offer({
    id: 'o6',
    sender: ME_SENDER,
    recipient: user('u-jiwoo', '최지우', '파도AI', '데이터 엔지니어'),
    message: '정산 데이터 파이프라인 이야기를 나눠 보고 싶어요.',
    status: 'ACCEPTED',
    createdAt: on(10, 14, 9),
  }),
  offer({
    id: 'o7',
    sender: ME_SENDER,
    recipient: user('u-minjae', '정민재', '별빛게임즈', 'DevOps'),
    message: '쿠버네티스 운영 노하우가 궁금해요. 30분 괜찮으실까요?',
    status: 'DECLINED',
    createdAt: on(10, 3, 18),
  }),
]
const messages: Record<string, OfferMessage[]> = {
  o3: [
    {
      id: 'm1',
      offerId: 'o3',
      sender: ME,
      body: '좋아요! 다음 주 화요일 점심 어떠세요?',
      createdAt: on(10, 14, 12),
    },
    {
      id: 'm2',
      offerId: 'o3',
      sender: { id: 'u-jiwoo', displayName: '최지우' },
      body: '좋아요. 강남역 근처에서 12시 반에 봬요.',
      createdAt: on(10, 14, 13),
    },
  ],
  o6: [
    {
      id: 'm3',
      offerId: 'o6',
      sender: { id: 'u-jiwoo', displayName: '최지우' },
      body: '제안 고마워요. 이번 주 금요일 저녁 괜찮으세요?',
      createdAt: on(10, 15, 9),
    },
  ],
}

const findOffer = (id: string) => received.find((o) => o.id === id) ?? sent.find((o) => o.id === id)
const notFound = {
  status: 404,
  body: { error: { code: 'NOT_FOUND', message: '제안을 찾지 못했어요' } },
}
const update = (id: string, patch: Partial<Offer>) => {
  const o = findOffer(id)
  if (!o) return notFound
  Object.assign(o, patch)
  return { data: o }
}

mock('GET', 'me/offers', ({ query }) => page(query.get('box') === 'sent' ? sent : received, query))
mock('GET', 'me/offers/:id', ({ params }) => {
  const o = findOffer(params.id!)
  if (!o) return notFound
  // Opening a received offer marks it read (보낸 사람에게 '읽음').
  if (o.recipient.id === 'me' && !o.readAt)
    Object.assign(o, {
      readAt: new Date().toISOString(),
      status: o.status === 'SENT' ? 'READ' : o.status,
    })
  return { data: o }
})
mock('POST', 'me/offers/:id/accept', ({ params, body }) => {
  const reply = (body as { reply?: string } | undefined)?.reply
  if (reply)
    (messages[params.id!] ??= []).push({
      id: `m${Date.now()}`,
      offerId: params.id!,
      sender: ME,
      body: reply,
      createdAt: new Date().toISOString(),
    })
  return update(params.id!, { status: 'ACCEPTED' })
})
mock('POST', 'me/offers/:id/decline', ({ params }) => update(params.id!, { status: 'DECLINED' }))
mock('GET', 'me/offers/:id/messages', ({ params, query }) =>
  page(messages[params.id!] ?? [], query),
)
mock('POST', 'me/offers/:id/messages', ({ params, body }) => {
  const m: OfferMessage = {
    id: `m${Date.now()}`,
    offerId: params.id!,
    sender: ME_SENDER,
    body: (body as { body: string }).body,
    createdAt: new Date().toISOString(),
  }
  ;(messages[params.id!] ??= []).push(m)
  return { data: m }
})

// 설정
let settings: Settings = {
  notifyDeadline: true,
  notifyOffer: true,
  notifyComment: false,
  notifyAiDone: true,
  locale: 'ko',
  profilePublic: true,
  careerStatusVisibility: 'everyone',
  hideFromCurrentCompany: true,
  contactVisibility: 'accepted',
  defaultTone: 'as_is',
  chatRetentionDays: 30,
  allowAiReadMyFiles: true,
  aiAccessMode: 'AUTO',
  defaultEffort: 'MEDIUM',
  confirmBeforeEdit: true,
}
mock('DELETE', 'me', () => null)
mock('GET', 'auth/me', () => ({
  data: {
    id: 'me',
    displayName: '김서준',
    locale: 'ko',
    createdAt: on(1, 5),
    accountType: 'PERSONAL',
    companyId: null,
    companyRole: null,
    email: 'seojun.kim@gmail.com',
    provider: 'google',
  },
}))
mock('GET', 'me/settings', () => ({ data: settings }))
mock('PATCH', 'me/settings', ({ body }) => {
  settings = { ...settings, ...(body as Partial<Settings>) }
  return { data: settings }
})
