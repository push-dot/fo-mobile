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
import type { CalendarEvent, HubDocument, ResumeDraft } from '@/features/my'
import { appliedOnly } from '@/features/my/utils/applied-only'
import { removeChatDoc } from './chat'
import { mock, page, pdfResponse } from './server'

const ME: UserRef = { id: 'me', displayName: '김서준', avatarUrl: null }
const ME_SENDER: Offer['sender'] = { ...ME, avatarUrl: null, companyName: null, headline: '' }
const ago = (ms: number) => new Date(Date.now() - ms).toISOString()
const H = 3_600_000
const D = 24 * H
const on = (m: number, d: number, h = 12, min = 0) => new Date(2026, m - 1, d, h, min).toISOString()
// Boards draw counts larger than the first page (18명, 8개); only `total` is reported, like push-be.
const withTotal = <T>(items: T[], query: URLSearchParams, total: number) => {
  const r = page(items, query)
  return { ...r, page: { ...r.page, total } }
}
const tomorrowAt = (h: number) => {
  const d = new Date(Date.now() + D)
  d.setHours(h, 0, 0, 0)
  return d.toISOString()
}

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
    '4년 동안 결제·정산 시스템을 설계하고 운영했어요. 트래픽이 몰리는 기간에도 장애 없는 결제를 만드는 데 집중해 왔어요.',
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
  skills: ['Kotlin', 'Spring Boot', 'JPA', 'MySQL', 'Kafka'],
  followerCount: 12,
  followingCount: 18,
  postCount: 8,
  resumeSourceId: 's1',
  updatedAt: ago(D),
}

// Followed people, shared with hub.ts. 이하은 starts unfollowed (프로필 상세 board shows 팔로우); me/follows marks everyone it lists.
export const following = new Set<string>()
export const myProfile = () => profile
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
let sources: (Source & { jobId?: string })[] = [
  src('s1', '김서준_백엔드_이력서_2026.pdf', 2_400_000, on(10, 12)),
  { ...src('s2', '경력기술서_모아페이.docx', 640_000, on(9, 28)), jobId: 'j-read' },
  { ...src('s3', '포트폴리오_결제시스템.pdf', 8_100_000, on(8, 3)), status: 'FAILED' },
]

// The 지원 서류 sheet lists with no kind filter and reads origin/kind: today's AI résumé first, the 포트폴리오 as an extra, the 읽는 중 docx left out (마이 › 서류 asks for UPLOAD).
const applySources = () => [
  { ...src('s-ai', '모아페이_백엔드_이력서_v2.pdf', 186_000, new Date().toISOString()), origin: 'AI' },
  ...sources.filter((s) => s.id !== 's2').map((s) => ({ ...s, origin: 'UPLOAD', ...(s.id === 's3' ? { kind: 'PORTFOLIO' } : {}) })),
]
mock('GET', 'sources', ({ query }) => page(query.get('kind') ? sources : applySources(), query))
// s2 stays 읽는 중: its ingest job never settles.
mock('GET', 'ai/jobs/:id', ({ params }) =>
  params.id === 'j-read'
    ? {
        data: {
          id: 'j-read',
          type: 'INGEST',
          status: 'RUNNING',
          progress: null,
          result: null,
          error: null,
          createdAt: on(9, 28),
          updatedAt: on(9, 28),
        },
      }
    : { status: 404, body: { error: { code: 'NOT_FOUND', message: '작업을 찾지 못했어요' } } },
)
mock('GET', 'sources/:id', ({ params }) => {
  const s = sources.find((x) => x.id === params.id)
  return s
    ? { data: s }
    : { status: 404, body: { error: { code: 'NOT_FOUND', message: '서류를 찾지 못했어요' } } }
})
mock('GET', 'sources/:id/content', ({ params }) =>
  sources.some((x) => x.id === params.id) ? pdfResponse() : { status: 404, body: { error: { code: 'NOT_FOUND', message: '서류를 찾지 못했어요' } } },
)
mock('DELETE', 'sources/:id', ({ params }) => {
  sources = sources.filter((x) => x.id !== params.id)
  removeChatDoc(params.id!)
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
    headline: '결제 시스템을 만드는 백엔드 개발자',
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
          '결제 승인 API를 다시 설계해 p95 응답 시간을 320ms에서 140ms로 줄였어요\nKafka로 승인 이벤트를 분리해 하루 280만 건을 처리했어요',
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
  { ...app('a1', 'p1', '모아페이', '백엔드 엔지니어 (Kotlin·Spring)', 'INTERVIEW', on(10, 14)), fitScore: 69 },
  app('a2', 'p3', '도토리증권', '서버 개발자 (Go)', 'SCREENING', on(10, 10)),
  app('a3', 'p8', '별빛게임즈', 'DevOps 엔지니어', 'APPLIED', on(10, 16)),
  app('a4', 'p7', '라온헬스', '백엔드 개발자 (Java)', 'ACCEPTED', on(9, 22)),
  app('a5', 'p6', '새벽마켓', '결제 플랫폼 엔지니어', 'REJECTED', on(9, 8)),
  // Applications behind the Push 서류 cards, not applied yet; push-be's GET /applications still lists them.
  ...(
    [
      ['a6', '다온뱅크', '서버 개발자', 76],
      ['a7', '해솔페이', '결제 플랫폼 개발', 69],
      ['a8', '모아페이', '백엔드 엔지니어', 81],
      ['a9', '온다컴퍼니', '플랫폼 백엔드', 81],
      ['a10', '리프페이', '서버 엔지니어', 72],
    ] as const
  ).map(([id, company, title, fitScore]) => ({
    ...app(id, 'p1', company, title, 'READY', on(10, 1)),
    appliedAt: null,
    fitScore,
  })),
]
mock('GET', 'applications', ({ query }) => {
  const applied = query.get('applied') === 'true'
  return page(applied ? appliedOnly(applications) : applications, query, applied)
})

const pushDoc = (id: string, applicationId: string, title: string, updatedAt: string): HubDocument => ({
  id,
  revision: 1,
  applicationId,
  title,
  kind: 'HUB_PROFILE',
  status: 'DRAFT',
  latestVersionId: 'v1',
  updatedAt,
})
let documents: HubDocument[] = [
  pushDoc('d1', 'a6', '서버 개발자 이력서', on(10, 15)),
  pushDoc('d2', 'a7', '경력기술서', on(10, 2)),
  pushDoc('d3', 'a8', '백엔드 엔지니어 이력서', on(10, 20)),
  pushDoc('d4', 'a9', '플랫폼 백엔드 이력서', on(9, 24)),
  pushDoc('d5', 'a10', '서버 엔지니어 이력서', on(9, 11)),
]

// The document the agent saved for the chat upload result card (its documentId), and a tailored draft never finalized; both outside 마이's list.
const agentDoc: HubDocument = { ...pushDoc('src-upload', '', '김서준_모아페이_백엔드', on(10, 20)), applicationId: null }
const draftDoc: HubDocument = { ...pushDoc('d-draft', '', '모아페이 맞춤 이력서', on(10, 21)), applicationId: null, kind: 'TAILORED' }
const findDoc = (id?: string) => [...documents, agentDoc, draftDoc].find((d) => d.id === id)
// push-be exports a HUB_PROFILE's latest version before finalize; no mock document is finalized.
const exportable = (d: HubDocument | undefined, versionId?: string) => d?.kind === 'HUB_PROFILE' && d.latestVersionId === versionId

mock('GET', 'documents', ({ query }) => page(documents, query))
mock('GET', 'documents/:id', ({ params }) => {
  const doc = findDoc(params.id)
  return doc
    ? { data: doc }
    : { status: 404, body: { error: { code: 'NOT_FOUND', message: '서류를 찾지 못했어요' } } }
})
mock('GET', 'documents/:id/versions/:versionId/export', ({ params }) =>
  exportable(findDoc(params.id), params.versionId)
    ? pdfResponse()
    : { status: 422, body: { error: { code: 'DOCUMENT_NOT_FINALIZED', message: 'only the finalized version can be exported' } } },
)
const docText = (type: 'heading' | 'paragraph', text: string) => ({ type, content: [{ type: 'text', text }] })
const hubContent = {
  type: 'doc',
  content: [
    docText('heading', '헤드라인'),
    docText('paragraph', '대규모 결제 트래픽을 견디는 서버를 만들어요'),
    docText('heading', '소개'),
    docText(
      'paragraph',
      '결제 승인과 정산 서버를 4년째 만들고 있어요. 트래픽이 몰려도 멈추지 않는 서버, 장애가 나도 돈이 새지 않는 구조를 설계하는 일을 잘해요.',
    ),
    docText('heading', '경력'),
    docText(
      'paragraph',
      '모아페이 | 백엔드 엔지니어 | 2022-03-01 |  | 결제 승인 API를 다시 설계해 p95 응답 시간을 320ms에서 140ms로 줄이고, Kafka로 하루 280만 건을 처리했어요.',
    ),
    docText('paragraph', '하루랩스 | 서버 개발자 | 2021-01-01 | 2022-02-28'),
    docText('heading', '기술 스택'),
    docText('paragraph', 'Kotlin, Spring Boot, Kafka, MySQL, Redis'),
  ],
}
// 지원 서류용 프로필(허브형) made from an uploaded file: the draft the profile tab already shows.
const profileContent = {
  type: 'doc',
  content: [
    docText('heading', '헤드라인'),
    docText('paragraph', '결제 시스템을 만드는 백엔드 개발자'),
    docText('heading', '소개'),
    docText(
      'paragraph',
      '4년 동안 결제·정산 시스템을 설계하고 운영했어요. 트래픽이 몰리는 기간에도 장애 없는 결제를 만드는 데 집중해 왔어요.',
    ),
    docText('heading', '경력'),
    docText('paragraph', '모아페이 | 백엔드 엔지니어 | 2022-03-01 |  | 결제 승인 API와 정산 배치를 맡고 있어요.'),
    docText('paragraph', '하루랩스 | 서버 개발자 | 2021-01-01 | 2022-02-28'),
    docText('heading', '기술 스택'),
    docText('paragraph', 'Kotlin, Spring Boot, JPA, MySQL, Kafka'),
  ],
}
mock('GET', 'documents/:id/versions', ({ params }) => {
  const doc = documents.find((d) => d.id === params.id)
  return {
    data: doc
      ? [
          {
            id: 'v1',
            blocks: [{ id: 'b1', text: '결제 승인 API를 설계해 p95 응답 시간을 줄였어요.' }],
            content: doc.applicationId ? hubContent : profileContent,
          },
        ]
      : [],
    page: { nextCursor: null, hasMore: false },
  }
})
mock('POST', 'documents/:id/base-profile', ({ params }) => {
  const doc = documents.find((d) => d.id === params.id)
  if (!doc) return { status: 404, body: { error: { code: 'NOT_FOUND', message: '서류를 찾지 못했어요' } } }
  profile = { ...profile, headline: doc.title.slice(0, 120), updatedAt: new Date().toISOString() }
  return { data: { documentId: doc.id, profileUserId: 'me' } }
})
mock('POST', 'documents/:id/profile', ({ params, body }) => {
  if (body && typeof body === 'object' && 'target' in body) {
    return { status: 400, body: { error: { code: 'FIELD', message: 'target is not sent' } } }
  }
  let doc = documents.find((d) => d.id === params.id)
  if (!doc) {
    const source = sources.find((s) => s.id === params.id)
    doc = {
      id: `d${Date.now()}`,
      revision: 1,
      applicationId: null,
      title: source?.fileName ?? '지원 서류용 프로필',
      kind: 'HUB_PROFILE',
      status: 'DRAFT',
      latestVersionId: 'v1',
      updatedAt: new Date().toISOString(),
    }
    documents = [doc, ...documents]
  }
  return { data: { documentId: doc.id, applicationId: doc.applicationId } }
})

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
  ev('e8', 'DEADLINE', '그린티켓 그로스 마케터', on(10, 24, 23, 59)),
  ev('e9', 'FOLLOW_UP', '도토리증권 결과 확인', on(10, 27, 10)),
  ev('e10', 'INTERVIEW', '별빛게임즈 1차 면접', on(10, 29, 16), {
    endsAt: on(10, 29, 17),
    notes: '판교 오피스',
  }),
  ev('e11', 'CUSTOM', '부하 테스트 스터디', on(10, 29, 20)),
  ev('e12', 'FOLLOW_UP', '모아페이 면접 후기 보내기', on(10, 30, 10)),
  // The calendar draws a day's dots in response order and the board lists 커피챗 before 후속 연락 there, so e15 precedes e14 (the day list sorts by time itself).
  ev('e15', 'COFFEE_CHAT', '오지현 님과 커피챗', on(10, 21, 18, 30), {
    notes: '받은 제안을 수락해서 잡힌 일정이에요',
  }),
  ev('e14', 'FOLLOW_UP', '모아페이 면접 감사 메일 보내기', on(10, 21, 17)),
]
// The board lists the 면접 once on the calendar and once on the application, so this one is only
// served to the application's next-event query. shortcut: told apart by `from`, which is the
// current time there and a local midnight on the calendar grid; drop when /calendar is real.
const nextInterview = ev('e13', 'INTERVIEW', '결제 플랫폼팀 1차 면접', tomorrowAt(15), {
  endsAt: tomorrowAt(16),
  notes: 'Google Meet',
  applicationId: 'a1',
})
mock('GET', 'calendar/events', ({ query }) => {
  const from = query.get('from') ?? ''
  const to = query.get('to') ?? '9999'
  const list = Date.parse(from) % 60_000 === 0 ? events : [...events, nextInterview]
  return page(list.filter((e) => e.startsAt >= from && e.startsAt < to), query)
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
// Ids match hub.ts so a row opens that person's hub profile.
const follows = [
  person('u2', '이하은', 'React로 사용자 경험을 다듬어요'),
  person('u1', '김태윤', '결제 시스템을 만드는 백엔드 개발자'),
  person('u4', '최지우', '데이터 파이프라인 · Spark · Airflow'),
  person('u3', '박도윤', 'SwiftUI로 앱을 만드는 iOS 개발자'),
  person('u5', '정민재', '쿠버네티스 운영이 즐거운 DevOps'),
  person('u-seoyun', '한서윤', '디자인 시스템을 만드는 프론트엔드'),
  person('u-jiho', '오지호', '추천 시스템 · ML 엔지니어'),
  person('u-sua', '윤수아', 'QA 자동화에 진심인 엔지니어'),
  person('u-geonwoo', '임건우', '결제 보안 · 인증 서버'),
]
const followers = [
  { ...follows[0]!, following: true },
  { ...person('u-jihyun', '오지현', '모아페이 결제 플랫폼팀 채용 담당'), following: false },
  { ...follows[2]!, following: true },
]
mock('GET', 'me/follows', ({ query }) => {
  for (const f of follows) following.add(f.userId)
  return withTotal(follows, query, 18)
})
mock('GET', 'me/followers', ({ query }) => withTotal(followers, query, 12))

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
  post('mp2', 'dev', '결제 승인 API p95를 절반 아래로 줄인 이야기', 31, 1204, on(10, 9)),
  post('mp3', 'work', '4년차 백엔드, 사이드 프로젝트 어떻게 하세요?', 24, 388, on(9, 21)),
  post('mp4', 'dev', 'Kafka 컨슈머 랙, 이렇게 잡았어요', 12, 640, on(9, 3)),
  post('mp5', 'career', '이직 준비하면서 바꾼 이력서 3가지', 41, 2310, on(8, 27)),
  post('mp6', 'dev', 'Redis 분산 락, 생각보다 까다로웠던 점', 9, 530, on(8, 14)),
  post('mp7', 'work', '팀 옮기고 첫 한 달 동안 한 일', 15, 702, on(7, 30)),
  post('mp8', 'dev', '정산 배치를 Spring Batch로 옮긴 후기', 22, 1480, on(7, 11)),
]
const commented = [
  post('cp1', 'dev', 'Kafka 컨슈머 랙, 다들 어떻게 모니터링하세요?', 42, 2310, ago(3 * H), {
    id: 'u5',
    displayName: '정민재',
  }),
  post('cp2', 'coffeechat', '판교 근처 백엔드 커피챗 하실 분', 12, 530, on(10, 11), {
    id: 'u1',
    displayName: '김태윤',
  }),
]
mock('GET', 'me/posts', ({ query }) => page(myPosts, query))
// social.ts owns `posts/:id` and 404s my ids, so index.ts loads this file first and these patterns
// (regex, not :params) catch the mp* ids only. shortcut: only mp1 has a body and comments.
mock('GET', 'posts/mp[0-9]+', ({ path }) => {
  const p = myPosts.find((x) => x.id === path.split('/').pop())
  return p
    ? { data: { ...p, body: '이직하면서 연봉 협상을 세 번 해 봤는데, 매번 준비한 만큼 결과가 달랐어요. 지금 연봉과 성과 숫자, 원하는 범위와 그 근거, 연봉 말고 협상할 수 있는 것들까지 미리 적어 두면 훨씬 덜 흔들려요.\n\n특히 "지금 얼마 받으세요?"라는 질문에 바로 숫자로 답하지 않는 연습이 제일 도움이 됐어요.' } }
    : { status: 404, body: { error: { code: 'NOT_FOUND', message: '게시물을 찾을 수 없어요' } } }
})
mock('GET', 'posts/mp[0-9]+/comments', ({ path, query }) =>
  page(
    path.includes('mp1/')
      ? [
          { id: 'mc-1', author: { id: 'u-haeun', displayName: '이하은', avatarUrl: null }, body: '숫자로 바로 답하지 않기, 다음 협상 때 꼭 써 볼게요.', parentId: null, createdAt: ago(20 * H) },
          { id: 'mc-2', author: { id: 'u3', displayName: '박도윤', avatarUrl: null }, body: '연봉 말고 협상할 수 있는 것들 예시도 더 궁금해요!', parentId: null, createdAt: ago(18 * H) },
        ]
      : [],
    query,
  ),
)
mock('GET', 'me/commented-posts', ({ query }) => withTotal(commented, query, 9))

// 제안함
// push-be embeds only a posting stub in offers.
// p25 lives in postings.ts so the card can read its location, career and deadline.
const offerPosting: OfferPosting = { id: 'p25', company: '모아페이', title: '결제 플랫폼 시니어 엔지니어', imageUrl: null }
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
    recipient: ME_SENDER,
    message:
      '서준 님, 안녕하세요! 허브에서 프로필 보고 연락드려요.\n\n결제 승인 API를 다시 설계하신 경험이 지금 저희 결제 플랫폼팀의 고민과 딱 맞아서요. 시니어 포지션으로 30분 정도 가볍게 커피챗 어떠세요?',
    posting: offerPosting,
    status: 'SENT',
    createdAt: on(10, 20, 1, 42),
  }),
  offer({
    id: 'o2',
    sender: user('u3', '박도윤', '하루랩스', 'iOS 개발자'),
    recipient: ME_SENDER,
    message:
      '주말 사이드 프로젝트를 같이 하실 백엔드 개발자를 찾고 있어요. 정산 쪽 경험이 있으시면 큰 도움이 될 것 같아요.',
    status: 'SENT',
    createdAt: ago(D + 3 * H),
  }),
  offer({
    id: 'o3',
    sender: user('u4', '최지우', '파도AI', '데이터 엔지니어'),
    recipient: ME_SENDER,
    message: '정산 데이터 파이프라인 경험을 듣고 싶어요. 30분 정도 이야기 나눌 수 있을까요?',
    status: 'ACCEPTED',
    createdAt: on(10, 14, 10),
  }),
  offer({
    id: 'o4',
    sender: { ...user('u-greenticket', '그린티켓 채용팀', '그린티켓', '서버 개발자 포지션'), kind: 'COMPANY' as const },
    recipient: ME_SENDER,
    message: '서버 개발자 포지션에 관심 있으시면 이야기 나눠 보고 싶어요.',
    status: 'DECLINED',
    createdAt: on(10, 2, 15),
  }),
]
const sent: Offer[] = [
  offer({
    id: 'o5',
    sender: ME_SENDER,
    recipient: user('u2', '이하은', '누리클라우드', '프론트엔드 개발자'),
    message: '디자인 시스템 경험이 인상 깊어서 커피챗 제안드려요.',
    status: 'SENT',
    createdAt: ago(D + 5 * H),
  }),
  offer({
    id: 'o6',
    sender: ME_SENDER,
    recipient: user('u4', '최지우', '파도AI', '데이터 엔지니어'),
    message: '정산 데이터 파이프라인 이야기를 나눠 보고 싶어요.',
    status: 'ACCEPTED',
    createdAt: on(10, 14, 9),
  }),
  offer({
    id: 'o7',
    sender: ME_SENDER,
    recipient: user('u5', '정민재', '별빛게임즈', 'DevOps'),
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
      sender: { id: 'u4', displayName: '최지우' },
      body: '좋아요. 강남역 근처에서 12시 반에 봬요.',
      createdAt: on(10, 14, 13),
    },
  ],
  o6: [
    {
      id: 'm3',
      offerId: 'o6',
      sender: { id: 'u4', displayName: '최지우' },
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

// The 받은 제안 board's first row previews the opening line and 2시간 전; the detail keeps the full message and its date.
const o1Row = (o: Offer): Offer =>
  o.id === 'o1'
    ? { ...o, message: '결제 플랫폼팀 시니어 포지션으로 가볍게 커피챗 어떠세요? 승인 API 개선하신 경험이 딱 저희 팀 고민이에요.', createdAt: ago(2 * H + 10 * 60_000) }
    : o
mock('GET', 'me/offers', ({ query }) => page(query.get('box') === 'sent' ? sent : received.map(o1Row), query))
// The boards draw o1 twice: the detail (two paragraphs; its date line slices the UTC day but shows the local clock, so shift the instant until
// both read 10월 20일 오전 1:42) and, once accepted, the thread's opening bubble (one paragraph, local day).
const o1Opening =
  '서준 님, 안녕하세요! 허브에서 프로필 보고 연락드려요. 결제 승인 API를 다시 설계하신 경험이 저희 팀 고민과 딱 맞아서요. 30분 정도 커피챗 어떠세요?'
const o1DetailAt = () => {
  const d = new Date(2026, 9, 20, 1, 42)
  return new Date(d.getUTCDate() < 20 ? d.getTime() + D : d.getTime()).toISOString()
}
const o1View = (o: Offer): Offer =>
  o.id !== 'o1' ? o : o.status === 'ACCEPTED' ? { ...o, message: o1Opening } : { ...o, createdAt: o1DetailAt() }
mock('GET', 'me/offers/:id', ({ params }) => {
  const o = findOffer(params.id!)
  if (!o) return notFound
  // Opening a received offer marks it read (보낸 사람에게 '읽음').
  if (o.recipient.id === 'me' && !o.readAt)
    Object.assign(o, {
      readAt: new Date().toISOString(),
      status: o.status === 'SENT' ? 'READ' : o.status,
    })
  return { data: o1View(o) }
})
// Android types ASCII only, so the tour's "Thank you" stands for the board's Korean reply (case-insensitive, like chat.ts aliases).
const REPLY_ALIAS: Record<string, string> = { 'thank you': '제안 감사해요, 지현 님! 다음 주 화요일이나 목요일 저녁이면 좋아요.' }
// Accepting o1 lands in the thread the 제안함 board draws, opened by the typed reply (no reply leaves the 메시지 · 빈 상태 thread);
// the 3s wait keeps the 보내는 중 button on screen.
const o1Thread = (typed: string): OfferMessage[] => [
  {
    id: 'm-o1-1',
    offerId: 'o1',
    sender: ME,
    body: REPLY_ALIAS[typed.trim().toLowerCase()] ?? typed,
    createdAt: on(10, 20, 9, 10),
  },
  {
    id: 'm-o1-2',
    offerId: 'o1',
    sender: { id: 'u-jihyun', displayName: '오지현' },
    body: '목요일 저녁 7시, 강남역 근처 어떠세요?',
    createdAt: on(10, 20, 10, 2),
  },
]
mock('POST', 'me/offers/:id/accept', async ({ params, body }) => {
  await new Promise((r) => setTimeout(r, 3000))
  const reply = (body as { reply?: string } | undefined)?.reply
  if (params.id === 'o1') messages.o1 = reply ? o1Thread(reply) : []
  else if (reply)
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
// The 보내지 못했어요 board needs a send that fails; the tour types one of these.
const FAILING_BODIES = ['좋아요. 그때 뵐게요!', 'fail']
mock('POST', 'me/offers/:id/messages', ({ params, body }) => {
  if (FAILING_BODIES.includes((body as { body: string }).body))
    return { status: 500, body: { error: { code: 'INTERNAL', message: '메시지를 보내지 못했어요' } } }
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
  notifyApplicationStage: true,
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
