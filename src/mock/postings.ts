import type { Posting, PostingDetail } from '@push/api-client'
import { mock, page } from './server'

const base = (p: Partial<Posting> & Pick<Posting, 'id' | 'company' | 'title' | 'location' | 'careerMin'>): Posting => ({
  jobCategory: 'dev',
  imageUrl: null,
  skills: [],
  careerMax: null,
  employmentType: 'full_time',
  deadline: null,
  bookmarked: false,
  applied: false,
  sourceUrl: null,
  createdAt: '2026-10-19T09:00:00Z',
  ...p,
})

const DAY = 86_400_000
// Deadlines keep their distance from the day the sample was written (2026-10-19), counted from today.
const inDays = (n: number) => {
  const d = new Date(Date.now() + n * DAY)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Sample data from the Claude Design boards (홈, 채용공고, 채용공고 상세).
export const postings: Posting[] = [
  base({ id: 'p1', company: '모아페이', title: '백엔드 엔지니어 (Kotlin·Spring)', location: '서울 강남구', careerMin: 4, careerMax: 6, skills: ['Kotlin', 'Spring Boot', 'JPA', 'Kafka'], deadline: inDays(13), bookmarked: true, sourceUrl: 'https://careers.moapay.kr/jobs/1182' }),
  base({ id: 'p2', company: '파도AI', title: '데이터 분석가', jobCategory: 'data', location: '서울 서초구', careerMin: 0, skills: ['SQL', 'Python'], deadline: inDays(2) }),
  base({ id: 'p3', company: '도토리증권', title: '서버 개발자 (Go)', location: '서울 영등포구', careerMin: 4, careerMax: 6, skills: ['Go', 'gRPC'], deadline: inDays(3) }),
  base({ id: 'p4', company: '누리클라우드', title: '프론트엔드 개발자 (React)', location: '서울 마포구', careerMin: 1, careerMax: 3, skills: ['React', 'TypeScript'], deadline: inDays(21) }),
  base({ id: 'p5', company: '그린티켓', title: '그로스 마케터', jobCategory: 'marketing', location: '서울 중구', careerMin: 1, careerMax: 3, deadline: inDays(4), createdAt: '2026-10-18T09:00:00Z' }),
  base({ id: 'p6', company: '새벽마켓', title: 'ML 엔지니어', location: '서울 송파구', careerMin: 7, skills: ['PyTorch', 'Python'], deadline: inDays(5) }),
  base({ id: 'p7', company: '라온헬스', title: '안드로이드 개발자', location: '서울 강남구', careerMin: 1, careerMax: 3, skills: ['Kotlin', 'Android'], deadline: inDays(6), bookmarked: true }),
  base({ id: 'p8', company: '별빛게임즈', title: 'DevOps 엔지니어', location: '경기 성남시', careerMin: 4, careerMax: 6, skills: ['Kubernetes', 'AWS'], deadline: inDays(16), bookmarked: true }),
  base({ id: 'p9', company: '누리클라우드', title: '백엔드 개발자', location: '서울 마포구', careerMin: 3, careerMax: 5, skills: ['Java', 'Spring Boot', 'MySQL'], deadline: inDays(24), createdAt: '2026-10-18T09:00:00Z' }),
  base({ id: 'p10', company: '라온헬스', title: '백엔드 개발자 (Java)', location: '서울 강남구', careerMin: 1, careerMax: 3, skills: ['Java', 'JPA', 'AWS'], deadline: inDays(32), createdAt: '2026-10-17T09:00:00Z' }),
  base({ id: 'p11', company: '그린티켓', title: '백엔드 엔지니어 (Node.js)', location: '서울 중구', careerMin: 2, careerMax: 4, skills: ['Node.js', 'TypeScript'], deadline: inDays(27), createdAt: '2026-10-16T09:00:00Z' }),
  base({ id: 'p12', company: '별빛게임즈', title: '게임 서버 백엔드', location: '성남 판교', careerMin: 3, skills: ['C++', 'Go'], deadline: inDays(42), createdAt: '2026-10-15T09:00:00Z' }),
  base({ id: 'p13', company: '모아페이', title: '프로덕트 디자이너', jobCategory: 'design', location: '서울 강남구', careerMin: 3, careerMax: 5, skills: ['Figma'], deadline: null, createdAt: '2026-10-14T09:00:00Z' }),
  base({ id: 'p14', company: '파도AI', title: 'AI 엔지니어 (LLM)', location: '원격', careerMin: 4, careerMax: 6, skills: ['Python', 'PyTorch'], employmentType: 'contract', deadline: inDays(20), createdAt: '2026-10-13T09:00:00Z' }),
  base({ id: 'p15', company: '바다물류', title: '데이터 엔지니어', jobCategory: 'data', location: '부산 해운대구', careerMin: 1, careerMax: 3, skills: ['Kafka', 'Python', 'AWS'], deadline: inDays(30), createdAt: '2026-10-12T09:00:00Z' }),
  base({ id: 'p16', company: '하늘항공', title: '서비스 기획자', jobCategory: 'plan', location: '인천 중구', careerMin: 0, deadline: inDays(7), createdAt: '2026-10-11T09:00:00Z' }),
  base({ id: 'p17', company: '한빛연구소', title: '연구 데이터 분석 인턴', jobCategory: 'data', location: '대전 유성구', careerMin: 0, skills: ['Python', 'SQL'], employmentType: 'intern', deadline: inDays(13), createdAt: '2026-10-10T09:00:00Z' }),
  base({ id: 'p18', company: '새벽마켓', title: 'B2B 영업 매니저', jobCategory: 'sales', location: '서울 송파구', careerMin: 4, careerMax: 6, deadline: inDays(34), createdAt: '2026-10-09T09:00:00Z' }),
  base({ id: 'p19', company: '도토리증권', title: 'HR 비즈니스 파트너', jobCategory: 'hr', location: '서울 영등포구', careerMin: 7, careerMax: 9, deadline: null, createdAt: '2026-10-08T09:00:00Z' }),
  base({ id: 'p20', company: '그린티켓', title: '재무회계 담당자', jobCategory: 'ops', location: '서울 중구', careerMin: 1, careerMax: 3, deadline: inDays(37), createdAt: '2026-10-07T09:00:00Z' }),
  base({ id: 'p21', company: '누리클라우드', title: '프론트엔드 개발자 (Vue)', location: '원격', careerMin: 1, careerMax: 3, skills: ['Vue', 'TypeScript'], employmentType: 'freelance', deadline: inDays(22), createdAt: '2026-10-06T09:00:00Z' }),
  base({ id: 'p22', company: '라온헬스', title: 'iOS 개발자', location: '서울 서초구', careerMin: 10, skills: ['Swift', 'SwiftUI'], deadline: inDays(43), createdAt: '2026-10-05T09:00:00Z' }),
  base({ id: 'p23', company: '바다물류', title: '물류 시스템 개발자', location: '경기 수원시', careerMin: 4, careerMax: 6, skills: ['Java', 'Spring Boot'], employmentType: 'dispatch', deadline: inDays(40), createdAt: '2026-10-04T09:00:00Z' }),
  base({ id: 'p24', company: '모아페이', title: '퍼포먼스 마케터', jobCategory: 'marketing', location: '서울 강남구', careerMin: 1, careerMax: 3, deadline: inDays(18), createdAt: '2026-10-03T09:00:00Z' }),
  base({ id: 'p25', company: '모아페이', title: '결제 플랫폼 시니어 엔지니어', location: '서울 강남구', careerMin: 5, deadline: inDays(21), createdAt: '2026-10-02T09:00:00Z' }),
]

// The home 새로 올라온 공고 cards show the long title the board drew; lists and detail use the short one.
const HOME_LATEST_TITLES: Record<string, string> = {
  p1: '백엔드 엔지니어 (Kotlin·Spring) · 결제 플랫폼팀',
  p2: '데이터 분석가 (추천·검색 랭킹 실험 설계)',
}

const details: Record<string, Partial<Omit<PostingDetail, keyof Posting>>> = {
  p1: {
    requirements: ['Kotlin 또는 Java로 4년 이상 서버 개발', 'Spring Boot, JPA 실무 경험'],
    preferred: ['결제·금융 도메인 경험', 'Kafka 등 메시징 시스템 운영 경험'],
    workConditions: { 근무: '주 5일, 유연 출퇴근 (코어 11–16시)', 보상: '연봉 협의 · 스톡옵션' },
  },
}

const days = (iso: string | null) => (iso ? (Date.parse(iso) - Date.now()) / DAY : Infinity)
const csv = (q: URLSearchParams, k: string) => q.get(k)?.split(',').filter(Boolean) ?? []

// 이번 주 조회수 (sort=popular).
const views: Record<string, number> = { p6: 980, p5: 870, p4: 760, p1: 650, p2: 540, p14: 430, p9: 320 }

// careerYears buckets overlap the posting's careerMin..careerMax range.
const BUCKETS: Record<string, [number, number]> = { '0': [0, 0], '1-3': [1, 3], '4-6': [4, 6], '7-9': [7, 9], '10+': [10, Infinity] }
const inBucket = (p: Posting, key: string) => {
  const [lo, hi] = BUCKETS[key] ?? [0, Infinity]
  return p.careerMin <= hi && (p.careerMax ?? Infinity) >= lo
}
// "서울" matches every 서울 district; "서울 강남구" only that one.
const inLocation = (p: Posting, loc: string) => p.location === loc || p.location.startsWith(`${loc} `)

const filter = (query: URLSearchParams) => {
  let list = postings.filter((p) => days(p.deadline) >= 0) // 마감된 공고는 숨긴다 (feature-spec 3.3)
  const q = query.get('q')?.trim().toLowerCase()
  if (q) list = list.filter((p) => `${p.company} ${p.title}`.toLowerCase().includes(q))
  const cats = csv(query, 'category')
  if (cats.length) list = list.filter((p) => cats.includes(p.jobCategory))
  const skills = csv(query, 'skills')
  if (skills.length) list = list.filter((p) => skills.some((s) => p.skills.includes(s)))
  const years = csv(query, 'careerYears')
  if (years.length) list = list.filter((p) => years.some((y) => inBucket(p, y)))
  const types = csv(query, 'employmentType')
  if (types.length) list = list.filter((p) => types.includes(p.employmentType))
  const locs = csv(query, 'location')
  if (locs.length) list = list.filter((p) => locs.some((l) => inLocation(p, l)))
  return list
}

// shortcut: the list header and filter sheets show the design's totals (1,284 …) for the filter sets the boards draw;
// anything else reports the real fixture count. Drop with the fixed numbers once push-be v2 serves real data.
const SHOWN_TOTALS: Record<string, number> = {
  '': 1284,
  'careerYears=4-6': 386,
  'category=dev,data': 512,
  'skills=Kotlin,Spring Boot,Kafka': 214,
  'location=서울 강남구,서울 서초구,서울 마포구': 398,
  'employmentType=full_time': 1021,
}
const FILTER_KEYS = ['category', 'skills', 'careerYears', 'location', 'employmentType']
const shownTotal = (query: URLSearchParams, actual: number) => {
  const sort = query.get('sort')
  if (query.get('q') || query.get('deadlineWithin') || sort === 'deadline' || sort === 'popular') return actual
  const key = FILTER_KEYS.filter((k) => csv(query, k).length).map((k) => `${k}=${csv(query, k).join(',')}`).join('&')
  return SHOWN_TOTALS[key] ?? actual
}

mock('GET', 'postings', ({ query }) => {
  let list = filter(query)
  const sort = query.get('sort')
  // Home sections reuse the list: ?sort=deadline → 마감 7일 이내 (feature-spec 3.3).
  if (query.get('deadlineWithin') === '7' || sort === 'deadline') list = list.filter((p) => days(p.deadline) <= 7)
  if (sort === 'deadline') list = list.sort((a, b) => days(a.deadline) - days(b.deadline))
  else if (sort === 'popular') list = list.filter((p) => views[p.id]).sort((a, b) => views[b.id]! - views[a.id]!)
  else list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  if (query.get('limit') === '10' && (sort ?? 'latest') === 'latest') list = list.map((p) => ({ ...p, title: HOME_LATEST_TITLES[p.id] ?? p.title }))
  const out = page(list, query, true)
  return { ...out, page: { ...out.page, total: shownTotal(query, list.length) } }
})

// Per-district counts for the 지역 sheet (the design's 서울 842 = 214 + 96 + 88 + 71 + 64 + 중구 309).
// shortcut: fixed table, ignores the other filters; the fixtures are too few to give these numbers.
const LOCATION_COUNTS: [string, number][] = [
  ['서울 강남구', 214], ['서울 서초구', 96], ['서울 마포구', 88], ['서울 영등포구', 71], ['서울 송파구', 64], ['서울 중구', 309],
  ['경기 성남시', 132], ['경기 수원시', 58], ['인천 중구', 47], ['부산 해운대구', 39], ['대전 유성구', 28], ['원격', 63],
]
mock('GET', 'postings/locations', () => ({ data: LOCATION_COUNTS.map(([location, count]) => ({ location, count })) }))

mock('GET', 'postings/:id', ({ params }) => {
  const p = postings.find((x) => x.id === params.id)
  if (!p) return { status: 404, body: { error: { code: 'NOT_FOUND', message: '공고를 찾지 못했어요.' } } }
  const detail: PostingDetail = {
    ...p,
    description: '결제 승인·취소 API를 설계하고 개발해요\n정산 배치의 성능과 정확도를 높여요',
    requirements: [],
    workConditions: {},
    ...details[p.id],
  }
  return { data: detail }
})

// Newest bookmark first, like the 허브 제안 sheet lists them.
// shortcut: p2 is in the 북마크 board's list but its card is unmarked on the home and list boards, so only this list knows it.
const bookmarkOrder = ['p1', 'p7', 'p8', 'p2']
const setBookmark = (id: string, on: boolean) => {
  const p = postings.find((x) => x.id === id)
  if (!p) return
  p.bookmarked = on
  const rest = bookmarkOrder.filter((x) => x !== id)
  bookmarkOrder.splice(0, bookmarkOrder.length, ...(on ? [id, ...rest] : rest))
}
mock('POST', 'postings/:id/bookmark', ({ params }) => setBookmark(params.id!, true))
mock('DELETE', 'postings/:id/bookmark', ({ params }) => setBookmark(params.id!, false))
// shortcut: the 허브 제안 sheet (the only limit=10 caller) draws the title without its stack suffix; drop when the sheet trims it.
const SHEET_TITLES: Record<string, string> = { p1: '백엔드 엔지니어' }
mock('GET', 'me/bookmarks', ({ query }) => {
  const sheet = query.get('limit') === '10'
  const list = bookmarkOrder.flatMap((id) => postings.find((p) => p.id === id) ?? []).map((p) => ({ ...p, bookmarked: true, title: (sheet && SHEET_TITLES[p.id]) || p.title, location: p.id === 'p8' ? '성남 판교' : p.location }))
  return page(list, query)
})
mock('POST', 'postings/:id/apply', ({ params }) => {
  const p = postings.find((x) => x.id === params.id)
  if (p) p.applied = true
  return { status: 201, body: { data: { id: `a-${params.id}`, stage: 'APPLIED' } } }
})
