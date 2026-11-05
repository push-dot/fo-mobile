import type { StreamEvent } from '@push/api-client'
import { describe, expect, it } from 'vitest'
import { applyEvent, emptyChat } from '../utils/reducer'
import { fromStream } from '../utils/stream'
import { PICK_HINT } from '../constants'
import type { ChatEvent } from '../types'

async function* frames(...evs: StreamEvent[]) {
  yield* evs
}
const collect = async <T,>(g: AsyncIterable<T>) => {
  const out: T[] = []
  for await (const x of g) out.push(x)
  return out
}
const map = (...evs: StreamEvent[]) => collect(fromStream(frames(...evs), () => frames()))
const labels = (event: ChatEvent) => {
  const section = event.type === 'approval' ? event.approval.sections[0] : undefined
  return section && section.kind === 'choices' ? section.items.map((i) => i.label) : []
}

describe('server gate labels', () => {
  it('renders the edit card as 적용 / 그대로 두기', async () => {
    const [ev] = await map({
      type: 'approval',
      id: 'edit',
      kind: 'DOCUMENT_EDIT',
      title: '이 수정을 적용할까요?',
      options: [
        { id: 'apply', label: '적용' },
        { id: 'keep', label: '그대로 두기' },
      ],
    })
    expect(ev).toMatchObject({ type: 'approval', approval: { question: '이 수정을 적용할까요?', optionIds: ['apply', 'keep'], secondary: '그대로 두기', submit: '적용' } })
    expect(labels(ev!)).toEqual([])
  })

  it('renders the dangerous-tool card from the summary, with 실행 / 취소', async () => {
    const [ev] = await map({
      type: 'approval',
      id: 'tool',
      kind: 'TOOL_ACTION',
      title: '이 공고에 지원해요',
      summary: '이 공고에 지원해요',
      options: [
        { id: 'approve', label: '실행' },
        { id: 'reject', label: '취소' },
      ],
    })
    expect(ev).toMatchObject({ type: 'approval', approval: { question: '이 공고에 지원해요', foot: PICK_HINT, warning: undefined } })
    expect(labels(ev!)).toEqual(['실행', '취소'])
  })

  it('renders verification, boost, and the profile result from the server options', async () => {
    const [fail] = await map({
      type: 'choice',
      id: 'validate_cap',
      title: '검증을 통과하지 못했어요. 다른 방향으로 다시 고를까요?',
      options: [
        { id: 'again', label: '다시 고르기' },
        { id: 'cancel', label: '그만하기' },
      ],
    })
    expect(labels(fail!)).toEqual(['다시 고르기', '그만하기'])

    const [boost] = await map({
      type: 'choice',
      id: 'boost',
      title: '점수를 한 번 더 올릴까요?',
      detail: '적합도 6.9 → 7.4 (+0.5)',
      options: [
        { id: 'continue', label: '한 번 더 올리기' },
        { id: 'stop', label: '여기서 멈추기' },
        { id: 'cancel', label: '그만하기' },
      ],
    })
    expect(boost).toMatchObject({ type: 'approval', approval: { question: '점수를 한 번 더 올릴까요?' } })
    expect(boost).not.toHaveProperty('approval.detail')
    expect(labels(boost!)).toEqual(['한 번 더 올리기', '여기서 멈추기', '그만하기'])

    const [saved] = await map({
      type: 'choice',
      id: 'present',
      title: 'Push 프로필에 저장했어요. 결과를 확인할까요?',
      detail: 'PDF는 Push 프로필에서 내보낼 수 있어요.',
      options: [
        { id: 'ok', label: '확인했어요' },
        { id: 'cancel', label: '그만하기' },
      ],
    })
    const state = applyEvent(emptyChat, saved!)
    expect(state.approval?.question).toBe('Push 프로필에 저장했어요. 결과를 확인할까요?')
    expect(state.approval).not.toHaveProperty('detail')
    expect(labels(saved!)).toEqual(['확인했어요', '그만하기'])
    expect(JSON.stringify(saved)).not.toContain('PDF로')
  })

  it('renders feedback, continue, and fit-check gates from the server options', async () => {
    const [feedback] = await map({
      type: 'choice',
      id: 'feedback',
      kind: 'RESUME_GATE',
      gate: 'feedback',
      title: '피드백을 반영해서 수정할까요?',
      options: [
        { id: 'continue', label: '반영해서 수정할게요' },
        { id: 'cancel', label: '그만하기' },
      ],
    })
    expect(feedback).toMatchObject({
      type: 'approval',
      approval: { id: 'feedback', question: '피드백을 반영해서 수정할까요?', optionIds: ['continue', 'cancel'] },
    })
    expect(labels(feedback!)).toEqual(['반영해서 수정할게요', '그만하기'])

    const [cont] = await map({
      type: 'choice',
      id: 'start-document',
      kind: 'RESUME_GATE',
      gate: 'start_document',
      title: '이어서 작성할까요?',
      options: [
        { id: 'continue', label: '이어서 작성하기' },
        { id: 'cancel', label: '그만하기' },
      ],
    })
    expect(cont).toMatchObject({
      type: 'approval',
      approval: { id: 'start-document', question: '이어서 작성할까요?', optionIds: ['continue', 'cancel'] },
    })
    expect(labels(cont!)).toEqual(['이어서 작성하기', '그만하기'])

    const [fit] = await map({
      type: 'choice',
      id: 'analyze',
      kind: 'RESUME_GATE',
      gate: 'analyze',
      title: '이 공고에 맞춰 이력서를 고칠까요?',
      options: [
        { id: 'continue', label: '네, 맞춰서 고쳐 주세요' },
        { id: 'feedback', label: '피드백만 받을게요' },
        { id: 'score', label: '점수만 보고 끝낼게요' },
      ],
    })
    expect(fit).toMatchObject({
      type: 'approval',
      approval: { id: 'analyze', question: '이 공고에 맞춰 이력서를 고칠까요?', optionIds: ['continue', 'feedback', 'score'] },
    })
    expect(labels(fit!)).toEqual(['네, 맞춰서 고쳐 주세요', '피드백만 받을게요', '점수만 보고 끝낼게요'])
    const state = applyEvent(emptyChat, fit!)
    expect(state.approval?.question).toBe('이 공고에 맞춰 이력서를 고칠까요?')
  })

  it('keeps a multi choice as a checkbox card', async () => {
    const [ev] = await map({
      type: 'choice',
      id: 'targets',
      multiple: true,
      title: '어떤 산출물을 만들까요?',
      options: [
        { id: 'resume', label: '이력서' },
        { id: 'portfolio', label: '포트폴리오' },
        { id: 'cover_letter', label: '자기소개서' },
        { id: 'cancel', label: '그만하기' },
      ],
    } as StreamEvent)
    expect(ev).toMatchObject({
      type: 'approval',
      approval: {
        optionIds: ['resume', 'portfolio', 'cover_letter', 'cancel'],
        sections: [{ kind: 'choices', multi: true, items: [{ label: '이력서' }, { label: '포트폴리오' }, { label: '자기소개서' }, { label: '그만하기' }] }],
      },
    })
  })
})
