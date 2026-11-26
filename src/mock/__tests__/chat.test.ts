import { describe, expect, it } from 'vitest'
import type { ChatEvent, Step } from '@/features/chat'
import { applyEvent, emptyChat } from '../../features/chat/utils/reducer'
import { mapEvent } from '../../features/chat/utils/stream'
import { mockFetch } from '../server'
import '../bots'
import { setAccount } from '../chat'

const call = async (method: string, path: string, body?: unknown) => {
  const res = await mockFetch(new Request(`http://x/api/v1/${path}`, { method, body: body === undefined ? undefined : JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }))
  return (await res.json()) as { data: unknown }
}
const steps = async (conversationId: string, extra: object) => (await call('POST', 'chat/runs', { conversationId, ...extra })).data as Step[]
const run = async (conversationId: string, extra: object) => (await steps(conversationId, extra)).flatMap((s) => mapEvent(s.frame))
const answer = (conversationId: string, approvalId: string, optionId: string) => run(conversationId, { resolve: { approvalId, optionId } })
const types = (events: ChatEvent[]) => events.map((e) => e.type)
type Surface = Extract<ChatEvent, { type: 'surface' }>
const surfaces = (events: ChatEvent[]) => events.filter((e): e is Surface => e.type === 'surface')
const kinds = (events: ChatEvent[]) => surfaces(events).map((e) => e.kind)
const asks = (events: ChatEvent[], id: string) => surfaces(events).some((e) => e.id === id)
const component = (e: Surface | undefined, type: string) => {
  const update = e?.messages.find((m) => 'updateComponents' in m)
  return update && 'updateComponents' in update ? update.updateComponents.components.find((c) => c.component === type) : undefined
}

describe('chat mock', () => {
  it('draws the 가져올 자료 board: four rows with the first two on, and 원래 말투로 first and on', async () => {
    const events = await run('t-ph0', { text: 'ph0-input' })
    const card = surfaces(events).find((e) => e.id === 'ph0-input')
    expect(component(card, 'PushChoice')).toMatchObject({ answer: 'submit', questions: [{ id: 'targets' }, { id: 'materials' }, { id: 'tone' }] })
  })

  it('lists the bookmarks and recent postings in the 부족한 점 찾기 sheet like 적합도 보기', async () => {
    const gap = (await call('GET', 'chat/quick-starts/gap')).data as { segments: string[]; items: { over?: string }[] }
    const fit = (await call('GET', 'chat/quick-starts/fit')).data
    expect(gap).toEqual(fit)
    expect(gap.items.some((i) => i.over === '모아페이')).toBe(true)
  })

  it('starts Bot으로 고치기 by reading the file, with no todo yet', async () => {
    const events = await run('t-fixdoc', { text: '이 서류를 고쳐 줘' })
    expect(types(events).slice(0, 2)).toEqual(['status', 'tool'])
    expect(kinds(events)).not.toContain('todo')
  })

  it('runs a tour token instead of the generic reply', async () => {
    const events = await run('t-free', { text: 'ph1-free' })
    expect(component(surfaces(events).find((e) => e.kind === 'fit'), 'PushFit')).toMatchObject({ locked: true })
  })

  it('draws the blueprints alone, with no failed check before them, for the ChatPh2XBlueprints shot', async () => {
    for (const text of ['ph2x-blueprints', '기획서 보여 줘']) {
      const events = await run(`t-bp-${text}`, { text })
      expect(kinds(events)).toContain('plan')
      expect(events.some((e) => e.type === 'notice')).toBe(false)
      expect(asks(events, 'ph2x-bp')).toBe(true)
    }
  })

  it('fails the first 병목 강도 pick and passes the second', async () => {
    await run('t-verify', { text: 'ph2x' })
    await answer('t-verify', 'ph2x-approach', '0')
    const first = await answer('t-verify', 'ph2x-level', '1')
    const second = await answer('t-verify', 'ph2x-verify', '0')
    expect(asks(first, 'ph2x-verify')).toBe(true)
    expect(kinds(second)).toContain('plan')
  })

  it('draws the failed check of the first 병목 강도 pick as a red line under the user line (ChatVerifyFail)', async () => {
    const events = await run('t-verify-notice', { text: 'verify-fail' })
    expect(events.find((e) => e.type === 'notice')).toMatchObject({ notice: { kind: 'failed', text: '방향 검증을 통과하지 못했어요.' } })
  })

  it('names the tool card in a waiting status right before it, as push-be does (ChatBotStatusApprove)', async () => {
    const events = await run('t-approve-stamp', { text: 'st-approve' })
    const at = events.findIndex((e) => e.type === 'surface' && e.id === 'st-approve')
    expect(events[at - 1]).toEqual({ type: 'wait', surfaceId: 'st-approve' })
    expect(component(events[at] as Surface, 'PushChoice')).toMatchObject({ questions: [{ choices: [{ id: 'approve' }, { id: 'approve_always' }, { id: 'reject' }] }] })
  })

  it('plays a run1 token for one natural line only, then the normal route', async () => {
    setAccount({ run: 'ext-done', once: true })
    const first = await run('t-once', { text: '이 이력서 더 좋게 고쳐 줘' })
    expect(kinds(first)).toContain('result')
    const second = await run('t-once-2', { text: '모아페이에 바로 지원해 줘' })
    expect(kinds(second)).not.toContain('result')
    expect(asks(second, 'apply')).toBe(true)
  })

  it('maps quick-start intents to their scenario', async () => {
    const boost = await run('t-boost', { text: '점수를 올려 주세요', intent: 'boost' })
    expect(asks(boost, 'ph3-boost')).toBe(true)
  })

  it('answers 마감 임박 공고 정리 in the chat as a list of bullets and to-dos, with no card', async () => {
    const events = await run('t-deadline', { text: '북마크한 공고 중 일주일 안에 마감되는 공고와 준비할 일을 알려 주세요', intent: 'deadline_postings' })
    const text = events.filter((e) => e.type === 'token').map((e) => e.text).join('\n')
    expect(text).toContain('• 파도AI · 데이터 분석가 · D-2')
    expect(text).toContain('1. 파도AI는')
    expect(surfaces(events)).toHaveLength(0)
    expect(events.at(-1)).toMatchObject({ type: 'done' })
  })

  it('jumps to the quality check without the boost card and applies the recommended fixes without asking; the design is the next turn', async () => {
    const events = await run('t-quality', { text: '품질 검사로 넘어가기' })
    expect(kinds(events)).not.toContain('fit')
    expect(events.some((e) => e.type === 'token' && e.text.includes('추천 수정까지 반영했어요'))).toBe(true)
    expect(surfaces(events)).toHaveLength(0)
    expect(events.at(-1)).toMatchObject({ type: 'done' })
    const design = await run('t-design', { text: '2개 반영하고 디자인으로' })
    const sentences = design.filter((e) => e.type === 'token').map((e) => e.text)
    expect(sentences).toEqual(['템플릿을 골라 주세요. 처음이라면 클래식을 추천해요.', '검증을 마쳤어요. 디자인을 골라 주세요.'])
    expect(component(surfaces(design).find((e) => e.id === 'ph4-design'), 'PushChoice')).toMatchObject({ answer: 'submit', submit: { labels: { MODERN: '모던으로 만들기' } } })
  })

  it('selects 중간 제약으로 in the 병목 강도 gate', async () => {
    const events = await run('t-level', { text: 'ph2x' })
    const gate = surfaces(await answer('t-level', 'ph2x-approach', '0')).find((e) => e.id === 'ph2x-level')
    expect(events).not.toHaveLength(0)
    expect(component(gate, 'PushChoice')).toMatchObject({ questions: [{ choices: [{ label: '가벼운 제약' }, { label: '중간 제약', recommended: true }, {}, {}] }] })
  })

  it('jumps to one phase in a fresh conversation, under the typed user line alone', async () => {
    expect(kinds(await run('t-ph2', { text: '네, 맞춰서 고쳐 주세요' }))).toContain('plan')
    const verify = await run('t-vf', { text: '중간 제약으로' })
    expect(verify).toContainEqual(expect.objectContaining({ type: 'tool', state: 'err' }))
    expect(asks(verify, 'ph2x-verify')).toBe(true)
  })

  it('holds the writing state with the draft card, while the run to the boost gate has no draft card', async () => {
    const writing = await steps('t-write', { text: '네, 써 주세요' })
    const paper = writing.findIndex((st) => st.frame.type === 'a2ui' && st.frame.kind === 'paper')
    expect(paper).toBeGreaterThan(-1)
    expect(writing[paper + 1]!.wait).toBeGreaterThan(30_000)
    await run('t-draft', { text: 'ph2' })
    const review = await answer('t-draft', 'ph2', '0')
    expect(kinds(review)).not.toContain('paper')
    expect(types(review)).not.toContain('file')
    expect(asks(review, 'ph3-review')).toBe(false)
    expect(asks(review, 'ph3-boost')).toBe(true)
  })

  it('draws the result boards as the result card alone, with no gate to answer, and the failed save with 다시 저장하기 only', async () => {
    for (const text of ['profile-result', 'ext-ok', 'ext-fail']) {
      const events = await run(`t-result-${text}`, { text })
      expect(types(events)).toEqual(['surface', 'done'])
      expect(kinds(events)).toEqual(['result'])
    }
    const failed = surfaces(await run('t-result-fail-2', { text: 'ext-fail' }))[0]
    expect(component(failed, 'PushDocument')).toMatchObject({ status: 'failed', actions: [{ id: 'retry_save' }] })
  })

  it('numbers a new run in a seeded conversation after its stored frames, also once its restored card is closed', async () => {
    expect(await steps('c-dotori', { resolve: { approvalId: 'ph3-review', optionId: 'review' } })).toEqual([])
    const frames = await steps('c-dotori', { text: '이어서 봐 주세요' })
    expect(Math.min(...frames.map((s) => s.frame.seq ?? 0))).toBeGreaterThan(2)
  })

  it('restores a deleted link with its fit count and date, and restores a live link as is', async () => {
    const ids = async () => ((await call('GET', 'me/links')).data as { id: string }[]).map((l) => l.id)
    const before = ((await call('GET', 'me/links')).data as { id: string }[]).find((l) => l.id === 'l1')
    expect((await mockFetch(new Request('http://x/api/v1/me/links/l1', { method: 'DELETE' }))).status).toBe(204)
    expect(await ids()).not.toContain('l1')
    expect((await call('POST', 'me/links/l1/restore')).data).toEqual(before)
    expect(await ids()).toContain('l1')
    expect((await call('POST', 'me/links/l1/restore')).data).toEqual(before)
  })

  it('holds the working line well past the 8s dwell for the Android tour token', async () => {
    const wait = async (text: string) => {
      const frames = await steps(`t-hold-${text}`, { text })
      const at = frames.findIndex((s) => s.frame.type === 'tool' && s.frame.name.endsWith('-fit') && s.frame.state === 'run')
      return frames[at + 1]!.wait
    }
    expect(await wait('tailor hold')).toBeGreaterThan(30_000)
    expect(await wait('tailor resume')).toBeLessThan(10_000)
  })

  it('serves an ULTRA account, and one with every credit spent that answers runs with the usage card error', async () => {
    expect((await call('GET', 'chat/account')).data).toMatchObject({ plan: 'PRO' })
    setAccount({ ultra: true })
    expect((await call('GET', 'chat/account')).data).toMatchObject({ plan: 'ULTRA', credits: { used: 12_800, total: 20_000 } })
    setAccount({ spent: true })
    expect((await call('GET', 'chat/account')).data).toMatchObject({ plan: 'ULTRA', credits: { used: 20_000, total: 20_000 } })
    const events = await run('t-spent', { text: '모아페이 공고에 맞춰 경력기술서도 써 줘' })
    expect(events).toMatchObject([{ type: 'error', code: 'INSUFFICIENT_CREDITS' }])
    setAccount({ ultra: false, spent: false })
    expect(kinds(await run('t-spent', { text: 'ph1-free' }))).toContain('fit')
  })

  it('payments-closed answers paymentsEnabled false and leaves it out otherwise', async () => {
    expect((await call('GET', 'chat/account')).data).not.toHaveProperty('paymentsEnabled')
    setAccount({ closed: true })
    expect((await call('GET', 'chat/account')).data).toMatchObject({ paymentsEnabled: false })
    setAccount({ closed: false })
    expect((await call('GET', 'chat/account')).data).not.toHaveProperty('paymentsEnabled')
  })

  it('draws ChatStates.4 in one conversation: file card, apply record, then QUEUE_BUSY with a 12s wait', async () => {
    const file = await run('t-states', { text: 'states-file' })
    expect(kinds(file)).toEqual(['result'])
    const applied = await run('t-states', { text: 'states-apply' })
    expect(applied).toContainEqual(expect.objectContaining({ type: 'token', text: '모아페이에 지원했어요.\n[이동하기](/my)' }))
    expect(await run('t-states', { text: '도토리증권 공고도 맞춰 줘' })).toContainEqual(
      expect.objectContaining({ type: 'error', code: 'QUEUE_BUSY', text: '지금 요청이 많아요. 12초 뒤에 다시 보내 주세요.' }),
    )
  })

  it('draws the finished task lines above the to-do card on the done boards', async () => {
    const order = async (text: string) => (await run(`t-${text}`, { text })).flatMap((e) => (e.type === 'tool' ? ['tool'] : e.type === 'surface' && e.kind === 'todo' ? ['todo'] : []))
    expect(await order('ext-done')).toEqual(['tool', 'tool', 'todo'])
    expect(await order('profile-done')).toEqual(['tool', 'todo'])
    expect(types(await run('t-profile-done-2', { text: 'profile-done' }))).not.toContain('wait')
  })

  it('stacks two results of one document in one conversation, each below its own message', async () => {
    const id = 't-twice'
    let state = emptyChat
    for (const n of [1, 2]) {
      state = applyEvent(state, { type: 'user', id: `u${n}`, text: '프로필 고쳐 줘' })
      for (const e of await run(id, { text: 'profile-done' })) state = applyEvent(state, e)
    }
    const at = (type: string) => state.items.flatMap((it, i) => (it.type === type || (it.type === 'surface' && it.kind === type) ? [i] : []))
    const users = at('user')
    const results = at('result')
    expect(results).toHaveLength(2)
    expect([...users, ...results].sort((a, b) => a - b)).toEqual([users[0], results[0], users[1], results[1]])
  })

  it('plays a chat token for any text when a run: switch is set, until reset', async () => {
    setAccount({ run: 'err-unavailable' })
    expect(await run('t-switch', { text: '모아페이 백엔드 공고에 맞춰 이력서 고쳐 주세요' })).toMatchObject([{ type: 'error', code: 'NOT_CONFIGURED' }])
    setAccount({ run: undefined })
    expect(kinds(await run('t-switch-off', { text: '모아페이 백엔드 공고에 맞춰 이력서 고쳐 주세요' }))).toContain('todo')
  })

  it('keeps one status verb while the interrupted run resumes', async () => {
    await run('t-int', { text: 'tailor hold' })
    const events = await run('t-int', { text: 'wait also write cover letter', interrupted: true })
    const verbs = events.flatMap((e) => (e.type === 'status' ? [e.verbs] : []))
    expect(verbs.flat()).toContain('다시 맞춰보는 중…')
    expect(verbs.flat()).not.toContain('견주어 보는 중…')
  })

  it('serves two bookmarks-worth of documents and one link on the few-materials account', async () => {
    setAccount({ few: true })
    expect(((await call('GET', 'chat/docs')).data as { id: string }[]).map((d) => d.id)).toEqual(['d2', 'd4'])
    expect((await call('GET', 'me/links')).data).toHaveLength(1)
    setAccount({ few: false })
    expect((await call('GET', 'chat/docs')).data).toHaveLength(4)
  })
})

describe('clear chat', () => {
  const stale = (events: ChatEvent[]) => events.some((e) => e.type === 'token' && e.text.includes('다시 불러 주세요'))

  it('forgets the open card, so the next token runs its script', async () => {
    await run('push', { text: 'ph0-start' })
    expect(stale(await run('push', { text: 'profile-done' }))).toBe(true)
    await run('push', { text: 'ph0-start' })
    await mockFetch(new Request('http://x/api/v1/bots/push/transcript', { method: 'DELETE' }))
    expect(stale(await run('push', { text: 'profile-done' }))).toBe(false)
  })
})
