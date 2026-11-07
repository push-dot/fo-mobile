import { describe, expect, it } from 'vitest'
import type { ChatEvent, Step } from '@/features/chat'
import { mockFetch } from '../server'
import { setAccount } from '../chat'

const call = async (method: string, path: string, body?: unknown) => {
  const res = await mockFetch(new Request(`http://x/api/v1/${path}`, { method, body: body === undefined ? undefined : JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }))
  return (await res.json()) as { data: unknown }
}
const run = async (conversationId: string, extra: object) => ((await call('POST', 'chat/runs', { conversationId, ...extra })).data as Step[]).map((s) => s.event)
const types = (events: ChatEvent[]) => events.map((e) => e.type)

describe('chat mock', () => {
  it('seeds the five live conversations and three archived ones the design draws', async () => {
    const live = (await call('GET', 'conversations')).data as { id: string }[]
    const kept = (await call('GET', 'conversations?archived=true')).data as { id: string }[]
    expect(live.map((c) => c.id)).toEqual(['c-moa', 'c-dotori', 'c-career', 'c-pado', 'c-nuri'])
    expect(kept).toHaveLength(3)
  })

  it('serves one conversation by id, also when it is archived', async () => {
    expect((await call('GET', 'conversations/c-moa')).data).toMatchObject({ id: 'c-moa', revision: 1 })
    expect((await call('GET', 'conversations/a-toss')).data).toMatchObject({ title: '토스 백엔드 이력서' })
  })

  it('names the posting company on the 모아페이 conversations for the header pill', async () => {
    expect((await call('GET', 'conversations/c-moa')).data).toMatchObject({ company: '모아페이' })
    expect((await call('GET', 'conversations/c-dotori')).data).toMatchObject({ company: '모아페이' })
  })

  it('starts 에이전트로 고치기 by reading the file, with no todo yet', async () => {
    const events = await run('t-fixdoc', { text: '이 서류를 고쳐 줘' })
    expect(types(events).slice(0, 2)).toEqual(['status', 'tool'])
    expect(events.some((e) => e.type === 'todo')).toBe(false)
  })

  it('runs a tour token instead of the generic reply', async () => {
    const events = await run('t-free', { text: 'ph1-free' })
    const fit = events.find((e) => e.type === 'fit')
    expect(fit).toMatchObject({ plan: 'FREE' })
  })

  it('fails the first 병목 강도 pick and passes the second', async () => {
    await run('t-verify', { text: 'ph2x' })
    const first = await run('t-verify', { answer: { approvalId: 'ph2x-level', choice: 1 } })
    const second = await run('t-verify', { answer: { approvalId: 'ph2x-level', choice: 1 } })
    expect(first.some((e) => e.type === 'approval' && e.approval.id === 'ph2x-verify')).toBe(true)
    expect(types(second)).toContain('plan')
  })

  it('maps quick-start intents to their scenario', async () => {
    const boost = await run('t-boost', { text: '점수를 올려 주세요', intent: 'boost' })
    expect(boost.some((e) => e.type === 'approval' && e.approval.id === 'ph3-boost')).toBe(true)
  })

  it('jumps to the quality check without the boost card', async () => {
    const events = await run('t-quality', { text: '품질 검사로 넘어가기' })
    expect(types(events)).not.toContain('fit')
    expect(events.some((e) => e.type === 'approval' && e.approval.id === 'ph4-quality')).toBe(true)
  })

  it('selects 중간 제약으로 in the 병목 강도 gate', async () => {
    const events = await run('t-level', { text: 'ph2x' })
    const gate = (await run('t-level', { answer: { approvalId: 'ph2x-approach', choice: 0 } })).find((e) => e.type === 'approval')
    expect(events).not.toHaveLength(0)
    expect(gate).toMatchObject({ approval: { id: 'ph2x-level', sections: [{ selected: [1] }] } })
  })

  it('jumps to one phase in a fresh conversation, under the typed user line alone', async () => {
    expect(types(await run('t-ph2', { text: '네, 맞춰서 고쳐 주세요' }))).toContain('plan')
    const verify = await run('t-vf', { text: '중간 제약으로' })
    expect(verify).toContainEqual(expect.objectContaining({ type: 'tool', state: 'err' }))
    expect(verify.some((e) => e.type === 'approval' && e.approval.id === 'ph2x-verify')).toBe(true)
  })

  it('holds the writing state with the draft card, while the run to the review gate has no draft card', async () => {
    const writing = (await call('POST', 'chat/runs', { conversationId: 't-write', text: '네, 써 주세요' })).data as Step[]
    const paper = writing.findIndex((st) => st.event.type === 'paper')
    expect(paper).toBeGreaterThan(-1)
    expect(writing[paper + 1]!.wait).toBeGreaterThan(30_000)
    await run('t-draft', { text: 'ph2' })
    const review = await run('t-draft', { answer: { approvalId: 'ph2', choice: 0 } })
    expect(types(review)).not.toContain('paper')
    expect(types(review)).not.toContain('file')
    expect(review.some((e) => e.type === 'approval' && e.approval.id === 'ph3-review')).toBe(true)
  })

  it('draws the result gates as the closing line and the card alone, with no bullets or elapsed footer', async () => {
    for (const text of ['profile-gate', 'ext-ok', 'ext-fail']) {
      const events = await run(`t-gate-${text}`, { text })
      expect(types(events)).toEqual(['agentText', 'result', 'approval'])
      expect(events[0]).not.toHaveProperty('bullets')
    }
  })

  it('serves the stopped draft and its expired gate for 도토리증권 without a first user bubble', async () => {
    const turns = (await call('GET', 'conversations/c-dotori/turns')).data as { userMessageId: string | null; events: { type: string }[] }[]
    expect(turns[0]).toMatchObject({ userMessageId: null, events: [{ type: 'tool' }, { type: 'choice', resolution: { status: 'EXPIRED' } }] })
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
      const steps = (await call('POST', 'chat/runs', { conversationId: `t-hold-${text}`, text })).data as Step[]
      const run = steps.findIndex((s) => s.event.type === 'tool' && s.event.id.endsWith('-fit') && s.event.state === 'run')
      return steps[run + 1]!.wait
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
    expect(types(await run('t-spent', { text: 'ph1-free' }))).toContain('fit')
  })

  it('draws ChatStates.4 in one conversation: file card, apply record, then QUEUE_BUSY with a 12s wait', async () => {
    const file = await run('t-states', { text: 'states-file' })
    expect(file.find((e) => e.type === 'result')).toMatchObject({ source: 'external', actions: [] })
    const applied = await run('t-states', { text: 'states-apply' })
    expect(applied).toContainEqual(expect.objectContaining({ type: 'tool', state: 'ok', result: '지원했어요 · 마이 › 내 활동에 기록했어요' }))
    expect(await run('t-states', { text: '도토리증권 공고도 맞춰 줘' })).toContainEqual(
      expect.objectContaining({ type: 'error', code: 'QUEUE_BUSY', text: '지금 요청이 많아요. 12초 뒤에 다시 보내 주세요.' }),
    )
  })

  it('draws the finished task lines above the to-do card on the done boards', async () => {
    const order = async (text: string) => types(await run(`t-${text}`, { text })).filter((x) => x === 'tool' || x === 'todo')
    expect(await order('ext-done')).toEqual(['tool', 'tool', 'todo'])
    expect(await order('profile-done')).toEqual(['tool', 'todo'])
    expect(types(await run('t-profile-done-2', { text: 'profile-done' }))).not.toContain('approval')
  })

  it('plays a chat token for any text when a run: switch is set, until reset', async () => {
    setAccount({ run: 'err-unavailable' })
    expect(await run('t-switch', { text: '모아페이 백엔드 공고에 맞춰 이력서 고쳐 주세요' })).toMatchObject([{ type: 'error', code: 'NOT_CONFIGURED' }])
    setAccount({ run: undefined })
    expect(types(await run('t-switch-off', { text: '모아페이 백엔드 공고에 맞춰 이력서 고쳐 주세요' }))).toContain('todo')
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
