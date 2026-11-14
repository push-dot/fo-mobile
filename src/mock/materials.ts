// Mock of the /materials routes of push-be. Fixtures come from the board text of Materials, MaterialsDocs,
// MaterialsBookmarks, MaterialsLinks, MaterialsLong, MaterialsFromProfile, and MaterialDetail* (design version 396). Each
// section is newest first, as the server answers. A section's rows past what a board shows (the 8th 서류, links 7 to 10)
// are not drawn anywhere.
import type { BotContract } from '@push/api-client'
import { fixtureOf } from './bots'
import { mock } from './server'

type Material = BotContract.Material
type Section = BotContract.MaterialSection
type Kind = BotContract.MaterialKind
type LinkKind = Extract<Material, { kind: 'link' }>['linkKind']

const MOA: BotContract.BotRef = { id: 'b-moa', kind: 'company', displayName: '모아페이', color: 'teal' }
const DOTORI: BotContract.BotRef = { id: 'b-dotori', kind: 'company', displayName: '도토리증권', color: 'amber' }
const PUSH: BotContract.BotRef = { id: 'b-push', kind: 'push', displayName: 'Push Bot', color: null }
const NURI_LONG: BotContract.BotRef = { id: 'b-nuri', kind: 'company', displayName: '누리클라우드 플랫폼엔지니어링코리아 판교캠퍼스 유한회사', color: 'pink' }

// Decimal, as @push/shared fileSize prints it: 312 KB reads "312KB" (MaterialDetailDoc).
const KB = 1000
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

const link = (id: string, url: string, linkKind: LinkKind, addedAt: string, title = url, checked: string | null = null): Material => ({
  kind: 'link', id, title, url, host: new URL(url).hostname, linkKind, addedAt, lastCheckedAt: checked, lastCheckOk: checked === null ? null : true,
})

const yesterday = () => new Date(Date.now() - DAY).toISOString()

const docs = (): Material[] => [
  pdf('f0', '모아페이_지원동기_초안.pdf', '2026-11-05T02:00:00Z', MOA),
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
  link('l3', 'https://linkedin.com/in/seojun-kim', 'other', '2026-09-02T02:00:00Z'),
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
  doc: [pdf('f1', '김서준_모아페이_백엔드엔지니어_지원서류_최종_진짜최종_v7_수정본.pdf', '2026-11-02T06:14:00Z', NURI_LONG, 312 * KB, 2), ...docs().filter((m) => m.id !== 'f1')],
  bookmark: [bookmark('p-nuri-senior', '누리클라우드 플랫폼엔지니어링본부', '시니어 백엔드 엔지니어(결제·정산 플랫폼)', 21, '2026-11-01T02:00:00Z'), ...bookmarks().slice(1)],
  link: [
    link('l0', 'https://careers.nuricloud.co.kr/jobs/platform-engineering/backend-senior-2026-recruit?utm_source=push&utm_medium=app', 'job', '2026-11-01T02:00:00Z', '누리클라우드 시니어 백엔드 엔지니어(결제·정산 플랫폼) 채용 페이지', yesterday()),
    ...links().slice(0, 9),
  ],
})

const defaults = (): Record<Section, Material[]> => ({ doc: docs(), bookmark: bookmarks(), link: links() })

const keyOf = (m: { kind: Kind; id: string }) => `${m.kind}:${m.id}`

/**
 * The bot chats each material was attached in, most recent first. With the maker they are the material's 쓰인 대화
 * (MaterialDetailDoc: 모아페이 봇, 도토리증권 봇) and the materials of a bot (MaterialsFromProfile: 모아페이 서류 4, 북마크 1, 링크 3).
 */
// shortcut: a send to a bot does not add to this table, so the bot's materials stay as drawn; add it when a flow checks them.
const ATTACHED_IN: Record<string, BotContract.BotRef[]> = {
  'file:f1': [DOTORI],
  'file:f2': [MOA],
  'file:f4': [MOA],
  'posting:p1': [MOA],
  'link:l1': [MOA],
  'link:l2': [MOA],
  'link:l3': [MOA],
}

/** A deleted bot's chat is gone with it, and what it made reads as made by no one known. */
const live = (ref: BotContract.BotRef | null) => (ref && fixtureOf(ref.id) ? ref : null)

const listed = (m: Material): Material => (m.kind === 'file' || m.kind === 'document' ? { ...m, createdBy: live(m.createdBy) } : m)

/** The maker first, then the chats it was attached in. A bot's materials are the ones that name it here. */
const usedBy = (m: Material): BotContract.BotRef[] => {
  const maker = m.kind === 'file' || m.kind === 'document' ? live(m.createdBy) : null
  const chats = (ATTACHED_IN[keyOf(m)] ?? []).filter((b) => live(b) && b.id !== maker?.id)
  return maker ? [maker, ...chats] : chats
}

/**
 * MaterialsFromProfile draws 모아페이's own list as 서류 4: 모아페이_지원동기_초안.pdf (11월 5일), 김서준_백엔드_이력서, 경력기술서_2026, 포트폴리오_결제시스템.
 * The 서류 board (MaterialsDocs) has no 지원동기 draft and lists 면접_예상질문_모아페이 as made by 모아페이 Bot, so the first is shown only in a bot's list and the second only outside it.
 */
const ONLY_IN_BOT_LIST = new Set(['file:f0'])
const NOT_IN_BOT_LIST = new Set(['file:f5'])

let sections = defaults()
/** Deleted materials the server still keeps for 30 days: they leave every list until a restore. */
let kept = new Set<string>()

/** Tour switches (links.ts): `none` empties every section, a section name empties that one, `long` draws MaterialsLong. */
export const setMaterials = (set: 'default' | 'none' | 'long' | Section) => {
  sections = set === 'long' ? longSections() : defaults()
  kept = new Set()
  if (set === 'none') sections = { doc: [], bookmark: [], link: [] }
  else if (set !== 'default' && set !== 'long') sections[set] = []
}

export const SECTION_OF: Record<Kind, Section> = { file: 'doc', document: 'doc', posting: 'bookmark', link: 'link' }

const stored = (kind: Kind, id: string) => sections[SECTION_OF[kind]].find((m) => m.kind === kind && m.id === id)

/** A material the caller can still use, or nothing once it was deleted. */
export const findMaterial = (kind: Kind, id: string) => {
  const m = stored(kind, id)
  return m && !kept.has(keyOf(m)) ? m : undefined
}

const PREVIEW: Record<Section, number> = { doc: 4, bookmark: 3, link: 3 }
const TABS = ['all', 'doc', 'bookmark', 'link'] as const
const Q_MAX = 200

const textOf = (m: Material) => [m.title, m.kind === 'posting' ? m.company : '', m.kind === 'link' ? m.url : ''].join(' ').toLowerCase()

const notFound = () => ({ status: 404, body: { error: { code: 'NOT_FOUND', message: 'resource not found' } } })
const invalid = (field: string, message: string) => ({ status: 400, body: { error: { code: 'VALIDATION_ERROR', message, details: { field } } } })

mock('GET', 'materials', ({ query }) => {
  const tab = query.get('tab') ?? 'all'
  if (!TABS.some((t) => t === tab)) return invalid('tab', 'unknown tab')
  const raw = query.get('q') ?? ''
  if ([...raw].length > Q_MAX) return invalid('q', `q must be at most ${Q_MAX} characters`)
  const q = raw.trim().toLowerCase()
  const address = query.get('bot')
  const bot = address === null ? null : fixtureOf(address)?.bot.id
  if (bot === undefined) return notFound()
  const of = (s: Section) =>
    sections[s].filter((m) => !kept.has(keyOf(m)) && (!q || textOf(m).includes(q)) && (bot ? !NOT_IN_BOT_LIST.has(keyOf(m)) && usedBy(m).some((b) => b.id === bot) : !ONLY_IN_BOT_LIST.has(keyOf(m)))).map(listed)
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
  const detail: BotContract.MaterialDetail = { ...listed(m), usedBy: usedBy(m) }
  return { data: detail }
})

/** A second delete answers 204 again and changes nothing. */
mock('DELETE', 'materials/:kind/:id', ({ params }) => {
  const kind = kindOf(params.kind)
  const m = kind && stored(kind, params.id!)
  if (!m) return notFound()
  kept.add(keyOf(m))
  return undefined
})

/** Undoes a delete, and answers a material that was not deleted as it is. */
mock('POST', 'materials/:kind/:id/restore', ({ params }) => {
  const kind = kindOf(params.kind)
  const m = kind && stored(kind, params.id!)
  if (!m) return notFound()
  kept.delete(keyOf(m))
  return { data: listed(m) }
})
