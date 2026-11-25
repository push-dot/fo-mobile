import { describe, expect, it } from 'vitest'
import '../../../mock/chat'
import { mockFetch } from '../../../mock/server'
import { applyEvent, emptyChat } from '../utils/reducer'
import { mapEvent } from '../utils/stream'
import { choicesOf, componentOf, dataModel, type SurfaceItem } from '../utils/surface'
import type { ChatState, Step } from '../types'

const run = async (body: object): Promise<Step[]> => {
  const res = await mockFetch('http://x/api/v1/chat/runs', { method: 'POST', body: JSON.stringify(body) })
  return ((await res.json()) as { data: Step[] }).data
}
const play = (s: ChatState, steps: Step[]) =>
  steps.flatMap((st) => mapEvent(st.frame)).reduce((acc, e) => applyEvent(acc, e), applyEvent(s, { type: 'start', at: 0 }))
const answer = (conversationId: string, approvalId: string, optionId: string) => run({ conversationId, text: optionId, resolve: { approvalId, optionId } })
const reply = async (s: ChatState, conversationId: string, approvalId: string, optionId: string) =>
  play(applyEvent(s, { type: 'answer', surfaceId: approvalId, picked: [optionId] }), await answer(conversationId, approvalId, optionId))
const surfaces = (s: ChatState) => s.items.filter((i): i is SurfaceItem => i.type === 'surface')
const waitingCard = (s: ChatState) => surfaces(s).find((i) => i.id === s.waiting)
const choiceLabels = (s: ChatState) => {
  const card = waitingCard(s)
  return card ? choicesOf(card).map((c) => c.label) : []
}
const question = (s: ChatState) => {
  const card = waitingCard(s)
  return (componentOf(card!, 'PushChoice')?.questions as { title?: string }[])[0]?.title
}
const todoLabels = (s: ChatState) => {
  const todo = surfaces(s).findLast((i) => i.kind === 'todo')
  return todo ? (dataModel(todo).items as { text: string }[]).map((i) => i.text) : []
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
    expect(s.waiting).toBe('tailor-apply')
    expect(componentOf(waitingCard(s)!, 'PushDiff')).toMatchObject({
      title: '6줄을 더하고 4줄을 뺐어요',
      documentId: 'd1',
      lines: expect.arrayContaining([{ sign: '+', text: '결제 승인 API 재설계, p95 320ms → 140ms' }, { sign: '-', text: '결제 승인 API와 정산 배치를 맡고 있어요.' }]),
    })
    s = await reply(s, 't1', 'tailor-apply', 'apply')
    expect(dataModel(surfaces(s).find((i) => i.id === 'tailor-apply')!)).toMatchObject({ open: false, picked: ['apply'] })
    expect(todoLabels(s)).toEqual([
      '프로필 읽기',
      '공고 요건 정리',
      '적합도 계산',
      '경력 섹션 고치기',
      '프로필에 저장',
    ])
    expect(componentOf(surfaces(s).find((i) => i.kind === 'result')!, 'PushDocument')).toMatchObject({
      status: 'done',
      title: 'Push 프로필에 저장했어요',
      name: '김서준 · 백엔드 엔지니어',
      meta: 'Push 프로필 · 방금 수정',
      documentId: 'd1',
      actions: [{ id: 'view', label: '프로필 보기' }],
    })
    expect(s.waiting).toBeNull()
    expect(s.items.some((i) => i.type === 'worked')).toBe(true)
    expect(JSON.stringify(s.items)).not.toContain('PDF로')
  }, 10_000)

  it('an uploaded file ends on the file card and Push 프로필 만들기', async () => {
    const s = play(emptyChat, await run({ conversationId: 'up1', text: '이 파일로 맞춰 주세요', attachment: '김서준_모아페이_백엔드.pdf' }))
    expect(todoLabels(s).at(-1)).toBe('Push 프로필 만들기')
    const result = surfaces(s).find((i) => i.kind === 'result')!
    expect(componentOf(result, 'PushDocument')).toMatchObject({ status: 'done', actions: expect.arrayContaining([expect.objectContaining({ id: 'convert' })]) })
    expect(s.items.some((i) => i.type === 'worked')).toBe(true)
  }, 10_000)

  it('failing run ends in the 어떻게 할까요 choice', async () => {
    const s = play(emptyChat, await run({ conversationId: 't2', text: '실패 테스트' }))
    expect(s.items.find((i) => i.type === 'tool' && i.state === 'err')).toMatchObject({ error: expect.stringContaining('로그인') })
    expect(s.waiting).toBe('fail-choice')
  }, 10_000)

  it('prevention asks for several categories', async () => {
    let s = play(emptyChat, await run({ conversationId: 'p1', text: '이력서 만들어 주세요' }))
    s = await reply(s, 'p1', 'ph0', '1')
    s = await reply(s, 'p1', 'ph2x-approach', '1')
    expect(s.waiting).toBe('ph2x-prevent')
    expect(componentOf(waitingCard(s)!, 'PushChoice')).toMatchObject({ questions: [expect.objectContaining({ multiple: true })] })
  }, 10_000)

  it('fit check, feedback only, then the feedback card', async () => {
    let s = await reachFit('fit1')
    expect(question(s)).toBe('이 공고에 맞춰 이력서를 고칠까요?')
    expect(choiceLabels(s)).toEqual(['고치기', '피드백만 받기', '점수만 보기'])
    s = await reply(s, 'fit1', 'ph1-fit', '1')
    expect(s.items.filter((i) => i.type === 'agentText').at(-1)).toMatchObject({
      text: '이 공고 기준으로 고칠 점이에요.',
    })
    expect(componentOf(surfaces(s).find((i) => i.kind === 'plan')!, 'PushPlan')).toMatchObject({
      title: '고칠 점',
      rows: [expect.objectContaining({ tag: '성과', label: '성과가 숫자로 없어요' }), expect.objectContaining({ tag: '도메인', label: '도메인 경험이 약해요' })],
    })
    expect(question(s)).toBe('피드백을 반영해서 수정할까요?')
    expect(choiceLabels(s)).toEqual(['수정하기', '그대로 둘게요', '그만하기'])
    s = await reply(s, 'fit1', 'feedback', '1')
    expect(s.waiting).toBeNull()
    expect(s.items.filter((i) => i.type === 'agentText').at(-1)).toMatchObject({ text: '알겠어요. 필요할 때 다시 불러 주세요.' })
  }, 10_000)

  it('an in-progress document asks to continue', async () => {
    let s = play(emptyChat, await run({ conversationId: 'c-dotori', text: '이어서 봐 주세요' }))
    expect(question(s)).toBe('이어서 작성할까요?')
    expect(choiceLabels(s)).toEqual(['이어서 작성하기', '새로 시작하기'])
    s = await reply(s, 'c-dotori', 'start-document', '0')
    expect(s.waiting).toBeNull()
    expect(s.items.filter((i) => i.type === 'agentText').at(-1)).toMatchObject({ text: '멈춘 곳부터 이어서 할게요.' })
  }, 10_000)

  it('the running 도토리증권 bot asks to continue too', async () => {
    const s = play(emptyChat, await run({ conversationId: 'b-dotori', text: '새 이력서 만들어 줘' }))
    expect(question(s)).toBe('이어서 작성할까요?')
  }, 10_000)

  it('talking after stop resumes with the added to-do', async () => {
    await run({ conversationId: 't3', text: '공고에 맞춰 고쳐 주세요' })
    const steps = await run({ conversationId: 't3', text: '자기소개서도 같이 써 줘', interrupted: true })
    const s = play(emptyChat, steps)
    expect(todoLabels(s)).toContain('자기소개서 초안 쓰기')
  }, 10_000)
})
