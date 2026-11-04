import { describe, expect, it } from 'vitest'
import '../../../mock/chat'
import { mockFetch } from '../../../mock/server'
import { applyEvent, emptyChat } from '../utils/reducer'
import type { ChatState, Step } from '../types'

const run = async (body: object): Promise<Step[]> => {
  const res = await mockFetch('http://x/api/v1/chat/runs', { method: 'POST', body: JSON.stringify(body) })
  return ((await res.json()) as { data: Step[] }).data
}
const play = (s: ChatState, steps: Step[]) => steps.reduce((acc, st) => applyEvent(acc, st.event), applyEvent(s, { type: 'start', at: 0 }))

describe('scripted runs (mock)', () => {
  it('tailor: works, asks, then finishes on approval', async () => {
    let s = play(emptyChat, await run({ conversationId: 't1', text: '모아페이 공고에 맞춰 이력서 고쳐 주세요' }))
    expect(s.approval?.id).toBe('tailor-apply')
    expect(s.items.find((i) => i.type === 'diff')).toBeTruthy()
    s = applyEvent(s, { type: 'answer', text: '네, 반영해 주세요' })
    s = play(s, await run({ conversationId: 't1', text: '네', answer: { approvalId: 'tailor-apply', choice: 0 } }))
    // Continuation updates the same tool line instead of adding a new one.
    expect(s.items.filter((i) => i.type === 'tool' && i.action === '이력서 수정')).toMatchObject([{ state: 'ok' }])
    expect(s.items.some((i) => i.type === 'actions')).toBe(false)
    expect(s.approval?.question).toBe('Push 프로필에 저장했어요. 결과를 확인할까요?')
    expect(JSON.stringify(s.items)).not.toContain('PDF로')
  }, 10_000)

  it('failing run ends in the 어떻게 할까요 choice', async () => {
    const s = play(emptyChat, await run({ conversationId: 't2', text: '실패 테스트' }))
    expect(s.items.find((i) => i.type === 'tool' && i.state === 'err')).toMatchObject({ error: expect.stringContaining('로그인') })
    expect(s.approval?.id).toBe('fail-choice')
  }, 10_000)

  it('prevention asks for several categories', async () => {
    let s = play(emptyChat, await run({ conversationId: 'p1', text: '이력서 만들어 주세요' }))
    s = play(s, await run({ conversationId: 'p1', text: '경험', answer: { approvalId: 'ph0', choice: 1 } }))
    s = play(s, await run({ conversationId: 'p1', text: '예방', answer: { approvalId: 'ph2x-approach', choice: 1 } }))
    expect(s.approval?.id).toBe('ph2x-prevent')
    expect(s.approval?.sections[0]).toMatchObject({ kind: 'choices', multi: true })
  }, 10_000)

  it('talking after stop resumes with the added to-do', async () => {
    await run({ conversationId: 't3', text: '공고에 맞춰 고쳐 주세요' })
    const steps = await run({ conversationId: 't3', text: '자기소개서도 같이 써 줘', interrupted: true })
    const todo = steps.map((x) => x.event).find((e) => e.type === 'todo')
    expect(todo).toMatchObject({ items: expect.arrayContaining([expect.objectContaining({ added: true })]) })
  }, 10_000)
})
