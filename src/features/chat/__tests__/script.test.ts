import { describe, expect, it } from 'vitest'
import '../../../mock/chat'
import { mockFetch } from '../../../mock/server'
import { applyEvent, emptyChat } from '../utils/reducer'
import { mapEvent } from '../utils/stream'
import type { ChatState, Step } from '../types'

const run = async (body: object): Promise<Step[]> => {
  const res = await mockFetch('http://x/api/v1/chat/runs', { method: 'POST', body: JSON.stringify(body) })
  return ((await res.json()) as { data: Step[] }).data
}
/** What the screen draws from a run: its frames through the live stream's mapper, into the reducer. */
const play = (s: ChatState, steps: Step[]) =>
  steps.flatMap((st) => mapEvent(st.frame)).reduce((acc, e) => applyEvent(acc, e), applyEvent(s, { type: 'start', at: 0 }))
const answer = (conversationId: string, approvalId: string, optionId: string) => run({ conversationId, text: optionId, resolve: { approvalId, optionId } })
/** Answering a card puts the answer in the chat, then the run it starts plays below it. */
const reply = async (s: ChatState, conversationId: string, approvalId: string, optionId: string) =>
  play(applyEvent(s, { type: 'answer', text: optionId }), await answer(conversationId, approvalId, optionId))
const choiceLabels = (s: ChatState) => {
  const section = s.approval?.sections[0]
  return section?.kind === 'choices' ? section.items.map((i) => i.label) : []
}
const reachFit = async (id: string) => {
  let s = play(emptyChat, await run({ conversationId: id, text: '이력서 만들어 주세요' }))
  s = await reply(s, id, 'ph0', '0')
  s = await reply(s, id, 'ph0-input', 'submit')
  return reply(s, id, 'ph0-start', '0')
}

describe('scripted runs (mock)', () => {
  it('tailor: works, asks, then finishes on approval', async () => {
    let s = play(emptyChat, await run({ conversationId: 't1', text: '모아페이 공고에 맞춰 이력서 고쳐 주세요' }))
    expect(s.approval?.id).toBe('tailor-apply')
    expect(s.items.find((i) => i.type === 'diff')).toBeTruthy()
    s = await reply(s, 't1', 'tailor-apply', 'apply')
    const todo = s.items.findLast((i) => i.type === 'todo')
    expect(todo && todo.type === 'todo' ? todo.items.map((item) => item.label) : []).toEqual([
      '프로필 읽기',
      '공고 요건 정리',
      '적합도 계산',
      '경력 섹션 고치기',
      '프로필에 저장',
    ])
    expect(s.items.find((i) => i.type === 'result')).toMatchObject({
      source: 'profile',
      checklist: ['프로필 읽기', '공고 요건 정리', '적합도 계산', '경력 섹션 고치기', '프로필에 저장'],
      name: '김서준',
      title: '김서준 · 백엔드 엔지니어',
      subtitle: 'Push 프로필 · 방금 수정',
      documentId: 'd1',
    })
    expect(s.approval?.question).toBe('Push 프로필에 저장했어요. 결과를 확인할까요?')
    expect(s.items.some((i) => i.type === 'worked')).toBe(true)
    expect(JSON.stringify(s.items)).not.toContain('PDF로')
  }, 10_000)

  it('an uploaded file ends on the file card and PDF로 만들기', async () => {
    const s = play(emptyChat, await run({ conversationId: 'up1', text: '이 파일로 맞춰 주세요', attachment: '김서준_모아페이_백엔드.pdf' }))
    const todo = s.items.findLast((i) => i.type === 'todo')
    expect(todo && todo.type === 'todo' ? todo.items.at(-1)?.label : '').toBe('PDF로 만들기')
    expect(s.items.find((i) => i.type === 'result')).toMatchObject({
      source: 'external',
      fileName: '김서준_모아페이_백엔드.pdf',
      pageLine: 'A4 1쪽 · 186KB',
      cardMeta: 'A4 1쪽 · 186KB · 내 서류에 자동 저장됨',
      documentId: 'src-upload',
    })
    expect(s.items.some((i) => i.type === 'worked')).toBe(true)
  }, 10_000)

  it('failing run ends in the 어떻게 할까요 choice', async () => {
    const s = play(emptyChat, await run({ conversationId: 't2', text: '실패 테스트' }))
    expect(s.items.find((i) => i.type === 'tool' && i.state === 'err')).toMatchObject({ error: expect.stringContaining('로그인') })
    expect(s.approval?.id).toBe('fail-choice')
  }, 10_000)

  it('prevention asks for several categories', async () => {
    let s = play(emptyChat, await run({ conversationId: 'p1', text: '이력서 만들어 주세요' }))
    s = await reply(s, 'p1', 'ph0', '1')
    s = await reply(s, 'p1', 'ph2x-approach', '1')
    expect(s.approval?.id).toBe('ph2x-prevent')
    expect(s.approval?.sections[0]).toMatchObject({ kind: 'choices', multi: true })
  }, 10_000)

  it('fit check, feedback only, then the feedback card', async () => {
    let s = await reachFit('fit1')
    expect(s.approval?.question).toBe('이 공고에 맞춰 이력서를 고칠까요?')
    expect(choiceLabels(s)).toEqual(['네, 맞춰서 고쳐 주세요', '피드백만 받을게요', '점수만 보고 끝낼게요'])
    s = await reply(s, 'fit1', 'ph1-fit', '1')
    expect(s.items.filter((i) => i.type === 'agentText').at(-1)).toMatchObject({
      text: '이 공고 기준으로 고칠 점이에요.',
    })
    expect(s.items.find((i) => i.type === 'plan')).toMatchObject({ rows: expect.arrayContaining([expect.objectContaining({ tag: '키워드' })]) })
    expect(s.approval?.question).toBe('피드백을 반영해서 수정할까요?')
    expect(choiceLabels(s)).toEqual(['반영해서 수정할게요', '그만하기'])
    s = await reply(s, 'fit1', 'feedback', '1')
    expect(s.approval).toBeNull()
    expect(s.items.filter((i) => i.type === 'agentText').at(-1)).toMatchObject({ text: '알겠어요. 필요할 때 다시 불러 주세요.' })
  }, 10_000)

  it('an in-progress document asks to continue', async () => {
    let s = play(emptyChat, await run({ conversationId: 'c-dotori', text: '이어서 봐 주세요' }))
    expect(s.approval?.question).toBe('이어서 작성할까요?')
    expect(choiceLabels(s)).toEqual(['이어서 작성하기', '그만하기'])
    s = await reply(s, 'c-dotori', 'start-document', '0')
    expect(s.approval).toBeNull()
    expect(s.items.filter((i) => i.type === 'agentText').at(-1)).toMatchObject({ text: '멈춘 곳부터 이어서 할게요.' })
  }, 10_000)

  it('the running 도토리증권 bot asks to continue too', async () => {
    const s = play(emptyChat, await run({ conversationId: 'b-dotori', text: '새 이력서 만들어 줘' }))
    expect(s.approval?.question).toBe('이어서 작성할까요?')
  }, 10_000)

  it('talking after stop resumes with the added to-do', async () => {
    await run({ conversationId: 't3', text: '공고에 맞춰 고쳐 주세요' })
    const steps = await run({ conversationId: 't3', text: '자기소개서도 같이 써 줘', interrupted: true })
    const todo = steps.flatMap((x) => mapEvent(x.frame)).find((e) => e.type === 'todo')
    expect(todo).toMatchObject({ items: expect.arrayContaining([expect.objectContaining({ added: true })]) })
  }, 10_000)
})
