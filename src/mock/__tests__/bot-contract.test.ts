import { beforeEach, describe, expect, it } from 'vitest'
import { createBotApi, createClient, type BotApi, type BotContract } from '@push/api-client'
import { mockFetch } from '../index'
import { expireCard, readBot, resetBots, seedThread, setBotPlan, setBots } from '../bots'
import { grantReference } from '../chat'
import { setMaterials } from '../materials'

const api = createBotApi(createClient({ baseUrl: 'http://x/api/v1', getToken: () => 't', fetch: mockFetch, uuid: () => 'k' }))

const frames = async (stream: AsyncGenerator<BotContract.StreamEvent>) => {
  const out: BotContract.StreamEvent[] = []
  for await (const f of stream) out.push(f)
  return out
}

beforeEach(() => {
  resetBots()
  setMaterials('default')
  grantReference()
})

const withdrawConsent = () => mockFetch('http://x/api/v1/me/consents', { method: 'PUT', body: JSON.stringify({ referenceData: false }) })

// A Record over the api-client's functions: a function added there without a call here fails `tsc`.
const BOT_CALLS: Record<keyof BotApi['bots'], () => Promise<unknown>> = {
  list: async () => [await api.bots.list(), await api.bots.list({ postingId: 'p13' })],
  search: () => api.bots.search('모아'),
  create: () => api.bots.create({ postingId: 'p6', color: 'sky' }),
  linkPreview: () => api.bots.linkPreview('https://careers.moapay.co.kr/jobs/1042'),
  get: () => api.bots.get('push'),
  update: () => api.bots.update('b-moa', { expectedRevision: 1, notificationsMuted: true }),
  remove: () => api.bots.remove('b-sodam'),
  markRead: () => api.bots.markRead('push'),
  transcript: () => api.bots.transcript('b-moa'),
  clearChat: () => api.bots.clearChat('b-nuri'),
  findInChat: () => api.bots.findInChat('b-moa', '공고'),
  send: () => frames(api.bots.send('push', { text: '이번 주 마감 공고 알려 줘' })),
  follow: () => frames(api.bots.follow('b-moa')),
  cancel: () => api.bots.cancel('b-dotori'),
  answer: () => api.bots.answer('b-moa', 'card-moa-edit', { optionId: 'approve' }),
  retryCard: () => api.bots.retryCard('b-moa', 'card-moa-edit'),
}

const MATERIAL_CALLS: Record<keyof BotApi['materials'], () => Promise<unknown>> = {
  list: () => api.materials.list({ tab: 'all' }),
  get: () => api.materials.get('file', 'f1'),
  remove: () => api.materials.remove('link', 'l10'),
  restore: () => api.materials.restore('link', 'l10'),
}

describe('the mock answers every call of the bot contract', () => {
  it.each(Object.entries({ ...BOT_CALLS, ...MATERIAL_CALLS }))('%s', async (_name, call) => {
    await call()
  })
})

describe('bots', () => {
  it('lists the Push Bot first with the plan limit, and every date parses', async () => {
    const { data, limit } = await api.bots.list()
    expect(data[0]?.kind).toBe('push')
    expect(limit).toEqual({ plan: 'PRO', max: 20, used: 6, table: { FREE: 3, PRO: 20, ULTRA: null } })
    for (const bot of data) expect(Number.isNaN(Date.parse(bot.lastActivityAt))).toBe(false)
  })

  it.each([
    ['home', ['Push Bot', '파도AI', '모아페이', '도토리증권', '누리클라우드', '한빛모빌리티', '소담헬스']],
    ['long', ['Push Bot', '파도AI', '한빛모빌리티 자율주행 데이터플랫폼팀', '누리클라우드 플랫폼엔지니어링코리아 판교캠퍼스 유한회사', '모아페이', '소담헬스케어 디지털헬스연구소']],
  ] as const)('orders the %s bots by last activity, which is the row order of the board', async (set, names) => {
    setBots(set)
    expect((await api.bots.list()).data.map((b) => b.displayName)).toEqual(names)
  })

  it('opens the existing bot of a company instead of making a second one', async () => {
    const found = await api.bots.list({ postingId: 'p13' })
    expect(found.data.map((b) => b.id)).toEqual(['b-moa'])
    const again = await api.bots.create({ postingId: 'p13' })
    expect(again).toMatchObject({ created: false, bot: { id: 'b-moa' } })
  })

  it('refuses a new company bot at the plan limit, and a body with a key it does not take', async () => {
    setBotPlan('FREE')
    await expect(api.bots.create({ postingId: 'p6' })).rejects.toMatchObject({ code: 'BOT_LIMIT', status: 403, details: { limit: 3, plan: 'FREE' } })
    await expect(api.bots.create({ postingId: 'p6', companyName: 'x' } as BotContract.CreateBotBody)).rejects.toMatchObject({ status: 400 })
    await expect(api.bots.create({ postingId: 'p6', displayName: '  ' })).rejects.toMatchObject({ status: 400 })
  })

  it('asks for 참고 데이터 제공 before it creates a bot, sends, or answers a card', async () => {
    await withdrawConsent()
    const refused = { status: 403, code: 'CONSENT_REQUIRED' }
    await expect(api.bots.create({ postingId: 'p6' })).rejects.toMatchObject(refused)
    await expect(frames(api.bots.send('push', { text: '안녕' }))).rejects.toMatchObject(refused)
    await expect(api.bots.answer('b-moa', 'card-moa-edit', { optionId: 'approve' })).rejects.toMatchObject(refused)
    expect((await api.bots.list()).data).toHaveLength(7)
  })

  it('keeps the Push Bot, and checks the revision of an edit', async () => {
    await expect(api.bots.remove('push')).rejects.toMatchObject({ code: 'DEFAULT_BOT_PROTECTED' })
    await expect(api.bots.update('b-moa', { expectedRevision: 9, color: 'red' })).rejects.toMatchObject({ code: 'REVISION_CONFLICT', details: { currentRevision: 1 } })
    await expect(api.bots.update('push', { expectedRevision: 1, color: 'red' })).rejects.toMatchObject({ status: 400 })
  })

  it('finds bots by name or posting and messages by text, the Push Bot first and the rest newest first', async () => {
    const { data } = await api.bots.search('모아')
    expect(data.bots.map((b) => [b.displayName, b.line])).toEqual([['모아페이', '모아페이 · 백엔드 엔지니어']])
    // AgentHomeSearch draws the Push Bot hit (어제) above 도토리증권 (1시간 전), and cuts 도토리증권's right before the hit.
    expect(data.messages.map((m) => [m.bot.displayName, m.role])).toEqual([['Push Bot', 'ASSISTANT'], ['도토리증권', 'ASSISTANT']])
    expect(data.messages.map((m) => m.snippet)).toEqual(['모아페이 공고 마감이 이번 주 금요일이에요', '…모아페이 경력과 겹치는 부분을 정리했어요'])
  })

  it('reads the expired card of AgentHomeRowExpiredFailed as 대기 with no unread dot, ten minutes old', async () => {
    setBots('outcome')
    const { data } = await api.bots.list()
    const moa = data.find((b) => b.id === 'b-moa')!
    expect(moa).toMatchObject({ unread: false, activity: null, outcome: { kind: 'expired' } })
    expect(Date.now() - Date.parse(moa.lastActivityAt)).toBeGreaterThan(9.9 * 60_000)
    expect(Date.now() - Date.parse(moa.lastActivityAt)).toBeLessThan(10.5 * 60_000)
    expect(data.find((b) => b.id === 'b-dotori')).toMatchObject({ unread: false, activity: null, outcome: { kind: 'failed' } })
  })

  it('shows the Push Bot of AgentHomeNoBots unread with no line said, and AgentHomeError read (bot:push:read)', async () => {
    setBots('none')
    expect(await api.bots.get('push')).toMatchObject({ unread: true, lastMessage: null })
    await api.bots.markRead('push')
    expect((await api.bots.get('push')).unread).toBe(false)
    setBots('none')
    expect((await api.bots.get('push')).unread).toBe(true)
    readBot('push')
    expect((await api.bots.get('push')).unread).toBe(false)
    resetBots()
    expect((await api.bots.get('push')).unread).toBe(true)
    readBot('push')
    expect((await api.bots.get('push')).unread).toBe(false)
  })

  it('gives the first line of ChatBotHeader its three list lines', async () => {
    seedThread('b-moa', 'thread')
    const { data } = await api.bots.transcript('b-moa')
    const first = data.at(-1)!.assistant!.text
    expect(first.split('\n').slice(1)).toEqual(['- 결제 승인 API 재설계 경험을 처리량 수치와 함께 쓰기', '- 정산 배치 개선을 장애 대응 사례로 옮기기', '- Kafka 경험은 우대 요건이라 한 줄로 줄이기'])
  })

  it('lists the three bots of BotNewLimitDelete at the FREE limit, each with the role it was made from', async () => {
    setBots('limit')
    setBotPlan('FREE')
    const { data, limit } = await api.bots.list()
    expect(data.filter((b) => b.kind === 'company').map((b) => b.displayName)).toEqual(['모아페이', '누리클라우드', '한빛모빌리티'])
    expect(limit).toMatchObject({ plan: 'FREE', max: 3, used: 3 })
    expect((await api.bots.get('b-nuri')).posting?.title).toBe('프론트엔드 개발자')
  })

  it('resolves the posting link of BotNewLinkOk, and nothing else', async () => {
    expect(await api.bots.linkPreview('https://careers.moapay.co.kr/jobs/1042')).toMatchObject({ status: 'found', postingId: 'p1', company: '모아페이', careerMin: 3, location: '서울', host: 'careers.moapay.co.kr' })
    expect(await api.bots.linkPreview('https://example.com/about')).toEqual({ status: 'not_a_posting' })
  })
})

describe('bot chat', () => {
  it('streams a send as stamped frames that end the turn, and stores the turn', async () => {
    const out = await frames(api.bots.send('push', { text: '이번 주 마감 공고 알려 줘' }))
    expect(out.map((f) => (f.type === 'status' ? `status:${f.phase}` : f.type))).toEqual(['status:queued', 'status:thinking', 'status:working', 'token', 'done'])
    expect(new Set(out.map((f) => f.turn)).size).toBe(1)
    const { data } = await api.bots.transcript('push')
    expect(data[0]).toMatchObject({ status: 'DONE', user: { text: '이번 주 마감 공고 알려 줘' } })
  })

  it('refuses an attachment that is gone', async () => {
    await expect(frames(api.bots.send('push', { text: '봐 줘', attachments: [{ kind: 'file', id: 'nope' }] }))).rejects.toMatchObject({ code: 'ATTACHMENT_GONE' })
  })

  it('takes a posting that is not bookmarked, and refuses more than 10 attachments or a key it does not take', async () => {
    await frames(api.bots.send('push', { text: '이 공고 봐 줘', attachments: [{ kind: 'posting', id: 'p6' }] }))
    expect((await api.bots.transcript('push')).data[0]?.user?.attachments.map((a) => a.id)).toEqual(['p6'])
    const eleven = Array.from({ length: 11 }, () => ({ kind: 'posting' as const, id: 'p6' }))
    await expect(frames(api.bots.send('push', { text: '봐 줘', attachments: eleven }))).rejects.toMatchObject({ status: 400 })
    await expect(frames(api.bots.send('push', { text: '봐 줘', threadId: 'x' } as BotContract.SendBody))).rejects.toMatchObject({ status: 400 })
  })

  it('reattaches to a run under way and ends at once when nothing runs', async () => {
    const stop = new AbortController()
    const live = api.bots.follow('b-dotori', 0, stop.signal)
    const first = await live.next()
    stop.abort()
    expect(first.value).toMatchObject({ type: 'status', turn: 't-dotori-2' })
    expect(await frames(api.bots.follow('b-moa'))).toEqual([])
  })

  it('tells the reattach point of a running thread on the first page', async () => {
    const page = await api.bots.transcript('b-dotori')
    expect(page.live).toEqual({ turnId: 't-dotori-2', lastSeq: page.data[0]!.events.at(-1)!.seq })
    expect(page.data[0]?.status).toBe('RUNNING')
  })

  it('closes an expired card only with reject, and asks it again with the same lifetime', async () => {
    expireCard()
    await expect(api.bots.answer('b-moa', 'card-moa-page', { optionId: 'approve' })).rejects.toMatchObject({ status: 410, code: 'APPROVAL_EXPIRED' })
    const retry = await api.bots.retryCard('b-moa', 'card-moa-page')
    expect(Date.parse(retry.expiresAt) - Date.parse(retry.openedAt)).toBe(10 * 60_000)
    expect(await api.bots.answer('b-moa', 'card-moa-page', { optionId: 'approve_always' })).toMatchObject({ answer: { status: 'APPROVED' }, resumed: true })
  })

  it('closes an expired card with reject and resumes nothing', async () => {
    expireCard()
    expect(await api.bots.answer('b-moa', 'card-moa-page', { optionId: 'reject' })).toEqual({ answer: { id: 'card-moa-page', status: 'REJECTED', optionId: 'reject' }, resumed: false })
    await expect(api.bots.answer('b-moa', 'card-moa-page', { optionId: 'reject' })).rejects.toMatchObject({ status: 409, code: 'APPROVAL_ALREADY_RESOLVED' })
  })

  it('resumes the run on a reject of an open tool card as push-be does, and keeps the waiting status of an answered card', async () => {
    expect(await api.bots.answer('b-moa', 'card-moa-edit', { optionId: 'reject' })).toMatchObject({ answer: { status: 'REJECTED' }, resumed: true })
    const [turn] = (await api.bots.transcript('b-moa')).data
    expect(turn?.events.filter((e) => e.type === 'status').map((e) => e.type === 'status' && e.phase)).toEqual(['waiting'])
  })

  it('checks the bot, then consent, then the body, in the order push-be does', async () => {
    await withdrawConsent()
    await expect(frames(api.bots.send('b-gone', { text: '' }))).rejects.toMatchObject({ status: 404 })
    await expect(frames(api.bots.send('push', { text: '' }))).rejects.toMatchObject({ status: 403, code: 'CONSENT_REQUIRED' })
    await expect(api.bots.answer('b-gone', 'card-moa-edit', { optionId: 'nope' })).rejects.toMatchObject({ status: 404 })
    await expect(api.bots.answer('b-moa', 'card-gone', { optionId: 'nope' })).rejects.toMatchObject({ status: 403, code: 'CONSENT_REQUIRED' })
    grantReference()
    await expect(frames(api.bots.send('push', { text: '' }))).rejects.toMatchObject({ status: 400, details: { field: 'text' } })
    await expect(api.bots.answer('b-moa', 'card-gone', { optionId: 'nope', note: 'x' } as BotContract.CardAnswerBody)).rejects.toMatchObject({ status: 400, details: { field: 'note' } })
    await expect(api.bots.answer('b-moa', 'card-gone', { optionId: 'nope' })).rejects.toMatchObject({ status: 404 })
    await expect(api.bots.answer('b-moa', 'card-moa-edit', { optionId: 'nope' })).rejects.toMatchObject({ status: 400, details: { field: 'optionId' } })
  })
})

describe('server order', () => {
  const desc = (times: string[]) => expect([...times].sort().reverse()).toEqual(times)

  it('lists a new bot first among the company bots, as last activity orders them', async () => {
    setBots('none')
    await api.bots.create({ postingId: 'p6' })
    await api.bots.create({ postingId: 'p15' })
    const { data } = await api.bots.list()
    expect(data.map((b) => b.kind)).toEqual(['push', 'company', 'company'])
    desc(data.slice(1).map((b) => b.lastActivityAt))
  })

  it.each([['default'], ['long']] as const)('pages each %s material section newest first', async (set) => {
    setMaterials(set)
    const dateOf = (m: BotContract.Material) => (m.kind === 'posting' ? m.bookmarkedAt : m.kind === 'link' ? m.addedAt : m.updatedAt)
    for (const tab of ['doc', 'bookmark', 'link'] as const) desc((await api.materials.list({ tab })).sections[0]!.items.map(dateOf))
  })

  it('pages the transcript newest turn first', async () => {
    const { data } = await api.bots.transcript('b-moa')
    desc(data.map((t) => t.createdAt))
  })
})

describe('materials', () => {
  it('counts the Materials board and previews 4, 3, 3 on 전체', async () => {
    const page = await api.materials.list()
    expect(page.counts).toEqual({ doc: 8, bookmark: 6, link: 10 })
    expect(page.sections.map((s) => [s.section, s.items.length, s.nextCursor])).toEqual([['doc', 4, null], ['bookmark', 3, null], ['link', 3, null]])
  })

  it('filters every count by the search', async () => {
    expect((await api.materials.list({ q: '모아페이' })).counts).toEqual({ doc: 1, bookmark: 1, link: 0 })
  })

  const names = (refs: BotContract.BotRef[]) => refs.map((b) => b.displayName)

  it('names the maker first and then the chats it was attached in', async () => {
    expect(names((await api.materials.get('file', 'f1')).usedBy)).toEqual(['모아페이', '도토리증권'])
    expect(names((await api.materials.get('file', 'f3')).usedBy)).toEqual(['Push Bot'])
  })

  it("lists a bot's own materials, as many as its profile counts (MaterialsFromProfile)", async () => {
    const page = await api.materials.list({ bot: 'b-moa' })
    expect(page.counts).toEqual({ doc: 4, bookmark: 1, link: 3 })
    expect(page.sections.map((s) => s.items.map((m) => m.id))).toEqual([['f0', 'f1', 'f2', 'f4'], ['p1'], ['l1', 'l2', 'l3']])
    expect((await api.bots.get('b-moa')).materialCount).toBe(8)
    expect((await api.materials.list({ bot: 'push' })).counts).toEqual({ doc: 1, bookmark: 0, link: 0 })
    await expect(api.materials.list({ bot: 'b-gone' })).rejects.toMatchObject({ status: 404 })
  })

  it('sends the host of a link and one of the five kinds: LinkedIn is no kind', async () => {
    const [links] = (await api.materials.list({ tab: 'link' })).sections
    expect(links?.items.slice(0, 3).map((m) => m.kind === 'link' && [m.host, m.linkKind])).toEqual([['github.com', 'github'], ['seojun.dev', 'blog'], ['linkedin.com', 'other']])
  })

  it('keeps a deleted material out of every list until a restore brings it back', async () => {
    await api.materials.remove('file', 'f2')
    await api.materials.remove('file', 'f2')
    await expect(api.materials.get('file', 'f2')).rejects.toMatchObject({ status: 404 })
    expect((await api.materials.list()).counts.doc).toBe(7)
    await expect(frames(api.bots.send('push', { text: '봐 줘', attachments: [{ kind: 'file', id: 'f2' }] }))).rejects.toMatchObject({ code: 'ATTACHMENT_GONE' })
    expect(await api.materials.restore('file', 'f2')).toMatchObject({ kind: 'file', id: 'f2', title: '경력기술서_2026.pdf' })
    expect((await api.materials.list({ tab: 'doc' })).sections[0]?.items.map((m) => m.id).slice(0, 3)).toEqual(['f1', 'f2', 'f3'])
    await expect(api.materials.remove('file', 'nope')).rejects.toMatchObject({ status: 404 })
    await expect(api.materials.restore('file', 'nope')).rejects.toMatchObject({ status: 404 })
  })

  it("forgets a deleted bot's chat, and reads what it made as made by no one known", async () => {
    await api.bots.remove('b-dotori')
    expect(names((await api.materials.get('file', 'f1')).usedBy)).toEqual(['모아페이'])
    await api.bots.remove('b-moa')
    expect(await api.materials.get('file', 'f1')).toMatchObject({ createdBy: null, usedBy: [] })
    await expect(api.materials.list({ bot: 'b-moa' })).rejects.toMatchObject({ status: 404 })
  })
})
