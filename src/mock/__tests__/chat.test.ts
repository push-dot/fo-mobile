import { describe, expect, it } from 'vitest'
import type { ChatEvent, Step } from '@/features/chat'
import { mockFetch } from '../server'
import '../chat'

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

  it('serves the stopped draft and its expired gate for 도토리증권 without a first user bubble', async () => {
    const turns = (await call('GET', 'conversations/c-dotori/turns')).data as { userMessageId: string | null; events: { type: string }[] }[]
    expect(turns[0]).toMatchObject({ userMessageId: null, events: [{ type: 'tool' }, { type: 'choice', resolution: { status: 'EXPIRED' } }] })
  })
})
