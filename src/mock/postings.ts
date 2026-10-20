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

// Sample data from the Claude Design boards (홈, 채용공고, 채용공고 상세).
export const postings: Posting[] = [
  base({ id: 'p1', company: '모아페이', title: '백엔드 엔지니어 (Kotlin·Spring) · 결제 플랫폼팀', location: '서울 강남구', careerMin: 4, careerMax: 6, skills: ['Kotlin', 'Spring Boot', 'JPA', 'Kafka'], deadline: '2026-11-02', bookmarked: true, sourceUrl: 'https://careers.moapay.kr/jobs/1182' }),
  base({ id: 'p2', company: '파도AI', title: '데이터 분석가 (추천·검색 랭킹 실험 설계)', jobCategory: 'data', location: '서울 서초구', careerMin: 0, skills: ['SQL', 'Python'], deadline: '2026-10-22' }),
  base({ id: 'p3', company: '도토리증권', title: '서버 개발자 (Go)', location: '서울 영등포구', careerMin: 4, careerMax: 6, skills: ['Go', 'gRPC'], deadline: '2026-10-24' }),
  base({ id: 'p4', company: '누리클라우드', title: '프론트엔드 개발자 (React)', location: '서울 마포구', careerMin: 1, careerMax: 3, skills: ['React', 'TypeScript'], deadline: '2026-11-09' }),
  base({ id: 'p5', company: '그린티켓', title: '그로스 마케터', jobCategory: 'marketing', location: '서울 중구', careerMin: 1, careerMax: 3, deadline: '2026-10-25' }),
  base({ id: 'p6', company: '새벽마켓', title: 'ML 엔지니어', location: '서울 송파구', careerMin: 7, skills: ['PyTorch', 'Python'], deadline: '2026-10-29' }),
  base({ id: 'p7', company: '라온헬스', title: '안드로이드 개발자', location: '서울 강남구', careerMin: 1, careerMax: 3, skills: ['Kotlin', 'Android'], deadline: '2026-10-31' }),
  base({ id: 'p8', company: '별빛게임즈', title: 'DevOps 엔지니어', location: '경기 성남시', careerMin: 4, careerMax: 6, skills: ['Kubernetes', 'AWS'], deadline: '2026-11-04', bookmarked: true }),
  base({ id: 'p9', company: '누리클라우드', title: '백엔드 개발자', location: '서울 마포구', careerMin: 3, careerMax: 5, skills: ['Java', 'Spring Boot', 'MySQL'], deadline: '2026-11-12', createdAt: '2026-10-18T09:00:00Z' }),
  base({ id: 'p10', company: '라온헬스', title: '백엔드 개발자 (Java)', location: '서울 강남구', careerMin: 1, careerMax: 3, skills: ['Java', 'JPA', 'AWS'], deadline: '2026-11-20', createdAt: '2026-10-17T09:00:00Z' }),
  base({ id: 'p11', company: '그린티켓', title: '백엔드 엔지니어 (Node.js)', location: '서울 중구', careerMin: 2, careerMax: 4, skills: ['Node.js', 'TypeScript'], deadline: '2026-11-15', createdAt: '2026-10-16T09:00:00Z' }),
  base({ id: 'p12', company: '별빛게임즈', title: '게임 서버 백엔드', location: '경기 성남시', careerMin: 3, skills: ['C++', 'Go'], deadline: '2026-11-30', createdAt: '2026-10-15T09:00:00Z' }),
  base({ id: 'p13', company: '모아페이', title: '프로덕트 디자이너', jobCategory: 'design', location: '서울 강남구', careerMin: 3, careerMax: 5, skills: ['Figma'], deadline: null, createdAt: '2026-10-14T09:00:00Z' }),
  base({ id: 'p14', company: '파도AI', title: 'AI 엔지니어 (LLM)', location: '원격', careerMin: 4, careerMax: 6, skills: ['Python', 'PyTorch'], employmentType: 'contract', deadline: '2026-11-08', createdAt: '2026-10-13T09:00:00Z' }),
  base({ id: 'p15', company: '바다물류', title: '데이터 엔지니어', jobCategory: 'data', location: '부산 해운대구', careerMin: 1, careerMax: 3, skills: ['Kafka', 'Python', 'AWS'], deadline: '2026-11-18', createdAt: '2026-10-12T09:00:00Z' }),
  base({ id: 'p16', company: '하늘항공', title: '서비스 기획자', jobCategory: 'plan', location: '인천 중구', careerMin: 0, deadline: '2026-10-26', createdAt: '2026-10-11T09:00:00Z' }),
  base({ id: 'p17', company: '한빛연구소', title: '연구 데이터 분석 인턴', jobCategory: 'data', location: '대전 유성구', careerMin: 0, skills: ['Python', 'SQL'], employmentType: 'intern', deadline: '2026-11-01', createdAt: '2026-10-10T09:00:00Z' }),
  base({ id: 'p18', company: '새벽마켓', title: 'B2B 영업 매니저', jobCategory: 'sales', location: '서울 송파구', careerMin: 4, careerMax: 6, deadline: '2026-11-22', createdAt: '2026-10-09T09:00:00Z' }),
  base({ id: 'p19', company: '도토리증권', title: 'HR 비즈니스 파트너', jobCategory: 'hr', location: '서울 영등포구', careerMin: 7, careerMax: 9, deadline: null, createdAt: '2026-10-08T09:00:00Z' }),
  base({ id: 'p20', company: '그린티켓', title: '재무회계 담당자', jobCategory: 'ops', location: '서울 중구', careerMin: 1, careerMax: 3, deadline: '2026-11-25', createdAt: '2026-10-07T09:00:00Z' }),
  base({ id: 'p21', company: '누리클라우드', title: '프론트엔드 개발자 (Vue)', location: '원격', careerMin: 1, careerMax: 3, skills: ['Vue', 'TypeScript'], employmentType: 'freelance', deadline: '2026-11-10', createdAt: '2026-10-06T09:00:00Z' }),
  base({ id: 'p22', company: '라온헬스', title: 'iOS 개발자', location: '서울 서초구', careerMin: 10, skills: ['Swift', 'SwiftUI'], deadline: '2026-12-01', createdAt: '2026-10-05T09:00:00Z' }),
  base({ id: 'p23', company: '바다물류', title: '물류 시스템 개발자', location: '경기 수원시', careerMin: 4, careerMax: 6, skills: ['Java', 'Spring Boot'], employmentType: 'dispatch', deadline: '2026-11-28', createdAt: '2026-10-04T09:00:00Z' }),
  base({ id: 'p24', company: '모아페이', title: '퍼포먼스 마케터', jobCategory: 'marketing', location: '서울 강남구', careerMin: 1, careerMax: 3, deadline: '2026-11-06', createdAt: '2026-10-03T09:00:00Z' }),
]

const details: Record<string, Partial<Omit<PostingDetail, keyof Posting>>> = {
  p1: {
    requirements: ['Kotlin 또는 Java로 4년 이상 서버 개발', 'Spring Boot, JPA 실무 경험'],
    workConditions: { 근무: '주 5일, 유연 출퇴근 (코어 11–16시)', 보상: '연봉 협의 · 스톡옵션' },
  },
}

const days = (iso: string | null) => (iso ? (Date.parse(iso) - Date.now()) / 86_400_000 : Infinity)
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

const filter = (query: URLSearchParams, skip?: 'location') => {
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
  const locs = skip === 'location' ? [] : csv(query, 'location')
  if (locs.length) list = list.filter((p) => locs.some((l) => inLocation(p, l)))
  return list
}

mock('GET', 'postings', ({ query }) => {
  let list = filter(query)
  const sort = query.get('sort')
  // Home sections reuse the list: ?sort=deadline → 마감 7일 이내 (feature-spec 3.3).
  if (sort === 'deadline') list = list.filter((p) => days(p.deadline) <= 7).sort((a, b) => days(a.deadline) - days(b.deadline))
  else if (sort === 'popular') list = list.filter((p) => views[p.id]).sort((a, b) => views[b.id]! - views[a.id]!)
  else list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return page(list, query, true)
})

// Per-district counts for the 지역 sheet, ignoring the current location filter.
mock('GET', 'postings/locations', ({ query }) => {
  const counts = new Map<string, number>()
  for (const p of filter(query, 'location')) counts.set(p.location, (counts.get(p.location) ?? 0) + 1)
  return { data: [...counts].map(([location, count]) => ({ location, count })) }
})

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

const setBookmark = (id: string, on: boolean) => {
  const p = postings.find((x) => x.id === id)
  if (p) p.bookmarked = on
}
mock('POST', 'postings/:id/bookmark', ({ params }) => setBookmark(params.id!, true))
mock('DELETE', 'postings/:id/bookmark', ({ params }) => setBookmark(params.id!, false))
mock('GET', 'me/bookmarks', ({ query }) => page(postings.filter((p) => p.bookmarked), query))
mock('POST', 'postings/:id/apply', ({ params }) => {
  const p = postings.find((x) => x.id === params.id)
  if (p) p.applied = true
  return { status: 201, body: { data: { id: `a-${params.id}`, stage: 'APPLIED' } } }
})
