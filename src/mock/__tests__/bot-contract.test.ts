import { beforeEach, describe, expect, it } from 'vitest'
import { createBotApi, createClient, type BotApi, type BotContract } from '@push/api-client'
import { mockFetch } from '../index'
import { expireCard, resetBots, setBotPlan, setBots } from '../bots'
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
})

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
  })

  it('keeps the Push Bot, and checks the revision of an edit', async () => {
    await expect(api.bots.remove('push')).rejects.toMatchObject({ code: 'DEFAULT_BOT_PROTECTED' })
    await expect(api.bots.update('b-moa', { expectedRevision: 9, color: 'red' })).rejects.toMatchObject({ code: 'REVISION_CONFLICT', details: { currentRevision: 1 } })
    await expect(api.bots.update('push', { expectedRevision: 1, color: 'red' })).rejects.toMatchObject({ status: 400 })
  })

  it('finds bots by name or posting and messages by text, newest first', async () => {
    const { data } = await api.bots.search('모아')
    expect(data.bots.map((b) => [b.displayName, b.line])).toEqual([['모아페이', '모아페이 · 백엔드 엔지니어']])
    // Newest first, as push-be orders them. AgentHomeSearch draws the Push Bot hit (어제) above 도토리증권 (1시간 전).
    expect(data.messages.map((m) => [m.bot.displayName, m.role])).toEqual([['도토리증권', 'ASSISTANT'], ['Push Bot', 'ASSISTANT']])
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
    expect((await api.bots.answer('b-moa', 'card-moa-page', { optionId: 'approve_always' })).answer.status).toBe('APPROVED')
  })
})

describe('server order', () => {
  // The AgentHome and AgentHomeLong fixtures keep the boards' row order (DESIGN-GAPS G1). Everything else is in server order.
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

  it('names the bots that used a material, and forgets a deleted one', async () => {
    expect((await api.materials.get('file', 'f1')).usedBy.map((b) => b.displayName)).toEqual(['모아페이', '도토리증권'])
    await api.materials.remove('posting', 'p3')
    await expect(api.materials.get('posting', 'p3')).rejects.toMatchObject({ status: 404 })
    expect((await api.materials.list()).counts.bookmark).toBe(5)
  })
})
