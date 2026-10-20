// Mock routes for the social area. Owned by that area's screens.
import type { Comment, Post, PostCategory, UserRef } from '@push/api-client'
import { mock, page } from './server'

const H = 3600_000
const at = (hoursAgo: number) => new Date(Date.now() - hoursAgo * H).toISOString()
const img = (seed: string) => `https://picsum.photos/seed/${seed}/800/600`

const user = (id: string, displayName: string): UserRef => ({ id, displayName, avatarUrl: null })
const ME = user('me', '김서준')
const subin = user('u-subin', '이수빈')
const haerin = user('u-haerin', '정해린')
const minho = user('u-minho', '강민호')
const doyun = user('u-doyun', '박도윤')
const yuna = user('u-yuna', '한유나')

const seed: Omit<Post, 'id' | 'createdAt'>[] = [
  { author: subin, category: 'career', title: '3년차 백엔드, 이직 타이밍 고민돼요', body: '지금 회사에서 배울 건 다 배운 느낌인데, 연봉 협상 시즌까지 기다리는 게 나을까요? 비슷한 고민 해보신 분들 의견이 궁금해요.', imageUrls: [], commentCount: 24, viewCount: 412 },
  { author: haerin, category: 'daily', title: '판교 점심 지도 만들어 봤어요', body: '회사 근처 다니면서 기록해 둔 곳들 공유해요. 국밥부터 샐러드까지 골고루 있어요! 혼밥하기 좋은 곳은 따로 표시해 뒀어요.', imageUrls: [img('lunch1'), img('lunch2'), img('lunch3')], commentCount: 12, viewCount: 230 },
  { author: minho, category: 'dev', title: 'Swift Concurrency 도입 후기', body: '레거시 콜백 코드를 async/await로 옮기면서 겪은 문제와 해결 방법을 정리했어요.', imageUrls: [img('swift1'), img('swift2')], commentCount: 31, viewCount: 980 },
  { author: doyun, category: 'coffeechat', title: '프론트엔드 5년차, 커피챗 열어요', body: '이직 준비나 포트폴리오 고민 있으시면 편하게 신청해 주세요. 주 2회 저녁에 가능해요.', imageUrls: [img('coffee')], commentCount: 8, viewCount: 155 },
  { author: yuna, category: 'work', title: '재택 2년 해 보고 느낀 점', body: '집중은 잘 되는데 동료와의 거리감이 생기더라고요. 저희 팀이 해 본 방법들을 적어 봤어요.', imageUrls: [img('home1'), img('home2'), img('home3'), img('home4')], commentCount: 19, viewCount: 610 },
  { author: subin, category: 'marketing', title: '첫 퍼포먼스 광고 집행 회고', body: '예산 200만 원으로 2주 동안 돌려 본 결과를 공유해요. 생각보다 크리에이티브가 중요했어요.', imageUrls: [], commentCount: 5, viewCount: 88 },
  { author: minho, category: 'talk', title: '요즘 다들 어떤 키보드 쓰세요?', body: '손목이 아파서 바꿔 보려는데 추천 부탁드려요.', imageUrls: [], commentCount: 42, viewCount: 1204 },
]

// Repeat the seed so the infinite feed has a few pages.
const posts: Post[] = Array.from({ length: 28 }, (_, i) => ({
  ...seed[i % seed.length]!,
  id: `post-${i + 1}`,
  createdAt: at(i === 0 ? 2 : i === 1 ? 4 : i === 2 ? 26 : i * 9),
}))

const comments: Record<string, Comment[]> = {
  'post-2': [
    { id: 'c-1', author: doyun, body: '두 번째 국밥집 진짜 맛있어요. 11시 반 전에 가야 안 기다려요!', parentId: null, createdAt: at(3) },
    { id: 'c-2', author: yuna, body: '혼밥 표시 너무 좋아요. 저장해 둘게요.', parentId: null, createdAt: at(2) },
    { id: 'c-3', author: haerin, body: '맞아요, 12시 넘으면 줄이 길어요.', parentId: 'c-1', createdAt: at(1) },
  ],
}

const uploads = new Map<string, string>()
let seq = 0

const notFound = { status: 404, body: { error: { code: 'NOT_FOUND', message: '게시물을 찾을 수 없어요' } } }

mock('GET', 'posts', ({ query }) => {
  const category = query.get('category') as PostCategory | null
  return page(category ? posts.filter((p) => p.category === category) : posts, query)
})

mock('GET', 'posts/:id', ({ params }) => {
  const p = posts.find((x) => x.id === params.id)
  if (!p) return notFound
  p.viewCount += 1
  return { data: p }
})

mock('POST', 'posts', ({ body }) => {
  const b = body as { category: PostCategory; title: string; body: string; imageKeys: string[] }
  const p: Post = {
    id: `post-new-${++seq}`,
    author: ME,
    category: b.category,
    title: b.title,
    body: b.body,
    imageUrls: b.imageKeys.map((k) => uploads.get(k) ?? img(k)),
    commentCount: 0,
    viewCount: 0,
    createdAt: new Date().toISOString(),
  }
  posts.unshift(p)
  return { status: 201, body: { data: p } }
})

mock('GET', 'posts/:id/comments', ({ params, query }) => page(comments[params.id!] ?? [], query))

mock('POST', 'posts/:id/comments', ({ params, body }) => {
  const p = posts.find((x) => x.id === params.id)
  if (!p) return notFound
  const b = body as { body: string; parentId?: string }
  const c: Comment = { id: `c-new-${++seq}`, author: ME, body: b.body, parentId: b.parentId ?? null, createdAt: new Date().toISOString() }
  ;(comments[p.id] ??= []).push(c)
  p.commentCount += 1
  return { status: 201, body: { data: c } }
})

// FormData body isn't inspected; every upload gets a placeholder image.
mock('POST', 'uploads/images', () => {
  const key = `img-${++seq}`
  uploads.set(key, img(key))
  return { status: 201, body: { data: { key, url: img(key) } } }
})
