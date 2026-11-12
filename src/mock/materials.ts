// Mock of the /materials routes of push-be. Fixtures come from the board text of Materials, MaterialsDocs,
// MaterialsBookmarks, MaterialsLinks, MaterialsLong, and MaterialDetail*. Each section is newest first, as the server
// answers. A section's rows past what a board shows (the 8th 서류, links 7 to 10) are not drawn anywhere.
import type { BotContract } from '@push/api-client'
import { mock } from './server'

type Material = BotContract.Material
type Section = BotContract.MaterialSection
type Kind = BotContract.MaterialKind

const MOA: BotContract.BotRef = { id: 'b-moa', kind: 'company', displayName: '모아페이', color: 'teal' }
const DOTORI: BotContract.BotRef = { id: 'b-dotori', kind: 'company', displayName: '도토리증권', color: 'amber' }
const PUSH: BotContract.BotRef = { id: 'b-push', kind: 'push', displayName: 'Push Bot', color: null }
const NURI_LONG: BotContract.BotRef = { id: 'b-nuri', kind: 'company', displayName: '누리클라우드 플랫폼엔지니어링코리아 판교캠퍼스 유한회사', color: 'pink' }

const KB = 1024
const PDF = 'application/pdf'

const pdf = (id: string, title: string, updatedAt: string, createdBy: BotContract.BotRef | null, size = 240 * KB, pageCount: number | null = 1): Material => ({
  kind: 'file', id, title, mimeType: PDF, size, pageCount, origin: createdBy ? 'AI' : 'UPLOAD', createdBy, updatedAt,
})

const DAY = 86_400_000
/** A deadline counted from today, so 마감 임박 labels hold in a capture. The boards are drawn on 2026-11-09. */
const dayIn = (days: number) => {
  const d = new Date(Date.now() + days * DAY)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const bookmark = (id: string, company: string, title: string, deadlineIn: number | null, bookmarkedAt: string, extra: Partial<Material> = {}): Material => ({
  kind: 'posting', id, title, company, deadline: deadlineIn === null ? null : dayIn(deadlineIn), closed: false,
  careerMin: null, careerMax: null, employmentType: null, location: null, bookmarkedAt, ...extra,
} as Material)

const link = (id: string, url: string, linkKind: Extract<Material, { kind: 'link' }>['linkKind'], addedAt: string, title = url, checked: string | null = null): Material => ({
  kind: 'link', id, title, url, linkKind, addedAt, lastCheckedAt: checked, lastCheckOk: checked === null ? null : true,
})

const yesterday = () => new Date(Date.now() - DAY).toISOString()

const docs = (): Material[] => [
  pdf('f1', '김서준_백엔드_이력서.pdf', '2026-11-02T06:14:00Z', MOA, 312 * KB, 2),
  pdf('f2', '경력기술서_2026.pdf', '2026-10-28T02:00:00Z', null),
  pdf('f3', '파도AI_자기소개서_초안.pdf', '2026-10-16T02:00:00Z', PUSH),
  pdf('f4', '포트폴리오_결제시스템.pdf', '2026-09-30T02:00:00Z', null),
  pdf('f5', '면접_예상질문_모아페이.pdf', '2026-09-12T02:00:00Z', MOA),
  pdf('f6', '졸업증명서.pdf', '2026-08-30T02:00:00Z', null),
  pdf('f7', '경력증명서_2025.pdf', '2026-08-02T02:00:00Z', null),
  { kind: 'document', id: 'd1', title: '김서준 기본 이력서', docKind: 'RESUME', origin: 'UPLOAD', createdBy: null, updatedAt: '2026-07-15T02:00:00Z' },
]

const bookmarks = (): Material[] => [
  bookmark('p1', '모아페이', '백엔드 엔지니어', 11, '2026-11-01T02:00:00Z', { careerMin: 3, employmentType: 'full_time', location: '서울 강남구' }),
  bookmark('p3', '도토리증권', '서버 개발자', 3, '2026-10-30T02:00:00Z'),
  bookmark('p9', '누리클라우드', '플랫폼 엔지니어', null, '2026-10-12T02:00:00Z'),
  bookmark('p-hanbit', '한빛모빌리티', '데이터 엔지니어', 22, '2026-09-28T02:00:00Z'),
  bookmark('p-sodam', '소담헬스', '백엔드 개발자', 21, '2026-09-10T02:00:00Z'),
  bookmark('p14', '파도AI', 'ML 플랫폼 엔지니어', null, '2026-09-03T02:00:00Z'),
]

const links = (): Material[] => [
  link('l1', 'https://github.com/seojun-kim', 'github', '2026-10-03T02:00:00Z', '김서준 GitHub', yesterday()),
  link('l2', 'https://seojun.dev/blog/payment-retry', 'blog', '2026-09-21T02:00:00Z'),
  link('l3', 'https://linkedin.com/in/seojun-kim', 'linkedin', '2026-09-02T02:00:00Z'),
  link('l4', 'https://seojun.dev', 'portfolio', '2026-08-30T02:00:00Z'),
  link('l5', 'https://velog.io/@seojun/kafka-retry', 'blog', '2026-08-11T02:00:00Z'),
  link('l6', 'https://github.com/seojun-kim/pay-gw', 'github', '2026-07-20T02:00:00Z'),
  link('l7', 'https://github.com/seojun-kim/settlement-batch', 'github', '2026-07-02T02:00:00Z'),
  link('l8', 'https://seojun.dev/projects', 'portfolio', '2026-06-18T02:00:00Z'),
  link('l9', 'https://velog.io/@seojun/spring-batch', 'blog', '2026-06-01T02:00:00Z'),
  link('l10', 'https://careers.moapay.kr/jobs/1182', 'job', '2026-05-20T02:00:00Z'),
]

/** MaterialsLong: the newest row of each section has the longest text the boards draw. */
const longSections = (): Record<Section, Material[]> => ({
  doc: [pdf('f1', '김서준_모아페이_백엔드엔지니어_지원서류_최종_진짜최종_v7_수정본.pdf', '2026-11-02T06:14:00Z', NURI_LONG, 312 * KB, 2), ...docs().slice(1)],
  bookmark: [bookmark('p-nuri-senior', '누리클라우드 플랫폼엔지니어링본부', '시니어 백엔드 엔지니어(결제·정산 플랫폼)', 21, '2026-11-01T02:00:00Z'), ...bookmarks().slice(1)],
  link: [
    link('l0', 'https://careers.nuricloud.co.kr/jobs/platform-engineering/backend-senior-2026-recruit?utm_source=push&utm_medium=app', 'job', '2026-11-01T02:00:00Z', '누리클라우드 시니어 백엔드 엔지니어(결제·정산 플랫폼) 채용 페이지', yesterday()),
    ...links().slice(0, 9),
  ],
})

const defaults = (): Record<Section, Material[]> => ({ doc: docs(), bookmark: bookmarks(), link: links() })

/** MaterialDetailDoc: 쓰인 대화 모아페이 봇, 도토리증권 봇. */
const USED_BY: Record<string, BotContract.BotRef[]> = { 'file:f1': [MOA, DOTORI] }

let sections = defaults()

/** Tour switches (links.ts): `none` empties every section, a section name empties that one, `long` draws MaterialsLong. */
export const setMaterials = (set: 'default' | 'none' | 'long' | Section) => {
  sections = set === 'long' ? longSections() : defaults()
  if (set === 'none') sections = { doc: [], bookmark: [], link: [] }
  else if (set !== 'default' && set !== 'long') sections[set] = []
}

export const SECTION_OF: Record<Kind, Section> = { file: 'doc', document: 'doc', posting: 'bookmark', link: 'link' }

export const findMaterial = (kind: Kind, id: string) => sections[SECTION_OF[kind]].find((m) => m.kind === kind && m.id === id)

const PREVIEW: Record<Section, number> = { doc: 4, bookmark: 3, link: 3 }
const TABS = ['all', 'doc', 'bookmark', 'link'] as const

const textOf = (m: Material) => [m.title, m.kind === 'posting' ? m.company : '', m.kind === 'link' ? m.url : ''].join(' ').toLowerCase()

const notFound = () => ({ status: 404, body: { error: { code: 'NOT_FOUND', message: 'resource not found' } } })

mock('GET', 'materials', ({ query }) => {
  const tab = query.get('tab') ?? 'all'
  if (!TABS.some((t) => t === tab)) return { status: 400, body: { error: { code: 'VALIDATION_ERROR', message: 'unknown tab', details: { field: 'tab' } } } }
  const q = (query.get('q') ?? '').trim().toLowerCase()
  const of = (s: Section) => sections[s].filter((m) => !q || textOf(m).includes(q))
  const counts = { doc: of('doc').length, bookmark: of('bookmark').length, link: of('link').length }
  if (tab === 'all') {
    const all: BotContract.MaterialsPage = { counts, sections: (['doc', 'bookmark', 'link'] as const).map((s) => ({ section: s, items: of(s).slice(0, PREVIEW[s]), nextCursor: null })) }
    return { data: all }
  }
  const section = tab as Section
  const limit = Math.min(Number(query.get('limit') ?? 20), 100)
  const start = Number(query.get('cursor') ?? 0)
  const items = of(section)
  const next = start + limit < items.length ? String(start + limit) : null
  const one: BotContract.MaterialsPage = { counts, sections: [{ section, items: items.slice(start, start + limit), nextCursor: next }] }
  return { data: one }
})

const kindOf = (raw: string | undefined): Kind | null => (raw === 'file' || raw === 'document' || raw === 'posting' || raw === 'link' ? raw : null)

mock('GET', 'materials/:kind/:id', ({ params }) => {
  const kind = kindOf(params.kind)
  const m = kind && findMaterial(kind, params.id!)
  if (!m) return notFound()
  const detail: BotContract.MaterialDetail = { ...m, usedBy: USED_BY[`${m.kind}:${m.id}`] ?? [] }
  return { data: detail }
})

mock('DELETE', 'materials/:kind/:id', ({ params }) => {
  const kind = kindOf(params.kind)
  const m = kind && findMaterial(kind, params.id!)
  if (!kind || !m) return notFound()
  const section = SECTION_OF[kind]
  sections = { ...sections, [section]: sections[section].filter((x) => x !== m) }
  return undefined
})
