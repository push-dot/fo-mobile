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
const play = (events: ChatEvent[]) => events.reduce(applyEvent, emptyChat)

describe('agent stream for the new design', () => {
  it('draws the tool target, result line, folded extra lines and the retry warning', async () => {
    const s = play(
      await map(
        { type: 'tool', name: 'explore_github', state: 'run', summary: 'GitHub 살펴보기', target: 'seojun-kim' },
        {
          type: 'tool', name: 'explore_github', state: 'ok', summary: 'GitHub 살펴보기', target: 'seojun-kim',
          resultLine: '저장소 12개 중 공고 관련 3개', extra: ['payment-retry-lab', 'settle-pipeline'], warning: '한 번 더 시도했어요',
        },
      ),
    )
    expect(s.items).toMatchObject([
      {
        type: 'tool', action: 'GitHub 살펴보기', target: 'seojun-kim', state: 'ok',
        result: '저장소 12개 중 공고 관련 3개', extra: ['payment-retry-lab', 'settle-pipeline'], warning: '한 번 더 시도했어요',
      },
    ])
  })

  it('keeps one to-do list per id and marks steps added later', async () => {
    const s = play(
      await map(
        { type: 'todo', id: 'analyze', items: [{ id: 'resume', text: '이력서 읽기', state: 'now' }] },
        { type: 'todo', id: 'analyze', items: [{ id: 'resume', text: '이력서 읽기', state: 'done' }, { id: 'github', text: 'GitHub 살펴보기', state: 'now', added: true }] },
        { type: 'todo', items: [{ id: 'save', text: '프로필에 저장', state: 'done' }] },
      ),
    )
    expect(s.items).toMatchObject([
      { type: 'todo', items: [{ label: '이력서 읽기', state: 'done' }, { label: 'GitHub 살펴보기', state: 'now', added: true }] },
      { type: 'todo', items: [{ label: '프로필에 저장', state: 'done' }] },
    ])
  })

  it('maps the analysis fit card with five parts, band, keywords, summary and the plan', async () => {
    const s = play(
      await map({
        type: 'fit', score: 6.9, topGap: '키워드', plan: 'ULTRA', band: '보통 · 개선 여지 있어요',
        parts: { techStack: 7.5, experienceLink: 7, careerLevel: 8, keyword: 4.5, domain: 5 },
        summary: '경력 수준은 잘 맞아요. 키워드와 도메인이 약해요.',
        keywords: [{ label: 'Kotlin', ok: true }, { label: 'Kafka', ok: false }],
        projected: { score: 8.2, label: '8점대', bullets: ['승인 API 성과를 숫자로 보여 주기'] },
        seq: 9,
      }),
    )
    expect(s.items).toEqual([
      {
        type: 'fit', id: 'fit-9', score: 6.9, caption: '보통 · 개선 여지 있어요', plan: 'ULTRA',
        summary: '경력 수준은 잘 맞아요. 키워드와 도메인이 약해요.',
        rows: [
          { label: '기술 스택', score: 7.5 }, { label: '경험 연관성', score: 7 }, { label: '경력 수준', score: 8 },
          { label: '키워드', score: 4.5 }, { label: '도메인', score: 5 },
        ],
        keywords: [{ label: 'Kotlin', ok: true }, { label: 'Kafka', ok: false }],
        projected: { label: '8점대', bullets: ['승인 API 성과를 숫자로 보여 주기'] },
      },
    ])
  })

  it('maps the boost card to the score change with its note and no part rows', async () => {
    const s = play(await map({ type: 'fit', score: 8.3, from: 6.9, delta: '+1.4', note: '적합도 6.9 → 8.3 (+1.4)', band: '높음 · 잘 맞아요', seq: 3 }))
    expect(s.items).toEqual([{ type: 'fit', id: 'fit-3', score: 8.3, from: 6.9, delta: '+1.4', note: '적합도 6.9 → 8.3 (+1.4)', caption: '높음 · 잘 맞아요' }])
  })

  it('puts the done summary with the score change in bold and its bullets above the result card', async () => {
    const s = play(
      await map({
        type: 'result', source: 'profile', taskLine: '프로필 수정 · Push 프로필 · 경력', checklist: [], documentId: 'd1', company: '모아페이',
        actions: [], name: '김서준', headline: '백엔드 엔지니어', title: '김서준 · 백엔드 엔지니어', subtitle: 'Push 프로필 · 방금 수정',
        summary: '다 됐어요! 적합도를 6.9 → 8.1로 올렸어요.', fitFrom: 6.9, fitTo: 8.1, bullets: ['Kafka를 기술 스택 맨 앞으로 옮겼어요'],
      }),
    )
    expect(s.items).toMatchObject([
      { type: 'agentText', text: '다 됐어요! 적합도를 **6.9 → 8.1**로 올렸어요.', bullets: ['Kafka를 기술 스택 맨 앞으로 옮겼어요'] },
      { type: 'result', source: 'profile', documentId: 'd1' },
    ])
    const plain = play(
      await map({
        type: 'result', source: 'external', taskLine: '', checklist: [], documentId: 'd2', actions: [], fileName: 'a.pdf', pageLine: '', cardMeta: '',
        summary: '다 됐어요! 이력서를 고쳤어요.', bullets: [],
      }),
    )
    expect(plain.items).toMatchObject([{ type: 'agentText', text: '다 됐어요! 이력서를 고쳤어요.' }, { type: 'result' }])
    expect(plain.items[0]).not.toHaveProperty('bullets')
  })

  it('previews the edit before it is approved and asks with two buttons', async () => {
    const s = play(
      await map({
        type: 'approval', id: 'ap', kind: 'DOCUMENT_EDIT', title: '이 수정을 적용할까요?',
        options: [{ id: 'apply', label: '적용' }, { id: 'skip', label: '그대로 두기' }],
        hunks: [{ line: 13, sign: '-', text: '결제 API 개발' }, { line: 13, sign: '+', text: '결제 승인 API 재설계' }],
      }),
    )
    expect(s.items).toMatchObject([{ type: 'diff', lines: [{ n: 13, sign: '-', text: '결제 API 개발' }, { n: 13, sign: '+', text: '결제 승인 API 재설계' }] }])
    expect(s.approval).toMatchObject({ question: '이 수정을 적용할까요?', submit: '적용', secondary: '그대로 두기', sections: [], optionIds: ['apply', 'skip'], foot: PICK_HINT })
  })

  it('shows the server warning under a risky action instead of the hint', async () => {
    const [ev] = await map({
      type: 'approval', id: 'go', kind: 'TOOL_ACTION', title: '이 공고에 지원해요', summary: '이 공고에 지원해요', foot: '지원하면 취소할 수 없어요',
      options: [{ id: 'approve', label: '실행' }, { id: 'reject', label: '취소' }],
    })
    expect(ev).toMatchObject({ type: 'approval', approval: { warning: '지원하면 취소할 수 없어요', foot: undefined } })
  })

  it('badges only the options the server tags and shows the pick hint on single-choice gates', async () => {
    const [review] = await map({
      type: 'choice', id: 'r', gate: 'review', title: '검증을 마쳤어요. 어떤 디자인을 적용할까요?', recommended: 'MODERN',
      detail: '템플릿을 골라 주세요. 처음이라면 클래식을 추천해요.',
      options: [{ id: 'CLASSIC', label: '클래식', badge: '추천' }, { id: 'MODERN', label: '모던', desc: '깔끔한 한 단' }, { id: 'cancel', label: '그만하기' }],
    })
    expect(review).toMatchObject({
      type: 'approval',
      approval: {
        detail: '템플릿을 골라 주세요. 처음이라면 클래식을 추천해요.',
        foot: PICK_HINT,
        sections: [{ items: [{ label: '클래식', badge: { label: '추천', tone: 'ac' } }, { label: '모던', desc: '깔끔한 한 단' }, { label: '그만하기' }] }],
      },
    })
    const items = review?.type === 'approval' && review.approval.sections[0]?.kind === 'choices' ? review.approval.sections[0].items : []
    expect(items[1]).not.toHaveProperty('badge')
    const [cap] = await map({ type: 'choice', id: 'v', gate: 'validate_cap', title: '검증을 통과하지 못했어요. 다른 방향으로 다시 고를까요?', options: [{ id: 'retry', label: '다시 고르기' }] })
    expect(cap).toMatchObject({ type: 'approval', approval: { foot: undefined } })
  })
})
