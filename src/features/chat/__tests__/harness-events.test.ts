import type { StreamEvent } from '@push/api-client'
import { describe, expect, it } from 'vitest'
import { applyEvent, emptyChat } from '../utils/reducer'
import { errorText, fromStream } from '../utils/stream'
import type { ChatEvent, ChatState } from '../types'

async function* frames(...evs: StreamEvent[]) {
  yield* evs
}
const collect = async <T,>(g: AsyncIterable<T>) => {
  const out: T[] = []
  for await (const x of g) out.push(x)
  return out
}
const map = (...evs: StreamEvent[]) => collect(fromStream(frames(...evs), () => frames()))
const play = (events: ChatEvent[], from: ChatState = emptyChat) => events.reduce(applyEvent, from)

describe('harness events', () => {
  it('maps every harness frame to a transcript item', async () => {
    const out = await map(
      { type: 'tool', name: 'read_posting', state: 'err', summary: '공고 읽기', result: { error: '링크가 열리지 않아요' } },
      { type: 'file', name: 'resume.pdf', mime: 'application/pdf', fileId: 'f1', documentId: null, downloadUrl: '/conversations/c/artifacts/resume.pdf' },
      { type: 'todo', items: [{ id: '1', text: '공고 읽기', state: 'done' }, { id: '2', text: '이력서 고치기', state: 'now' }] },
      { type: 'diff', documentId: 'd', revisionId: 'r', hunks: [{ line: 3, sign: '+', text: 'Kotlin' }, { line: null, sign: '', text: '...' }] },
      { type: 'fit', score: 7.5, parts: { techStack: 8, experienceLink: 6, keyword: 7 }, topGap: 'Kafka 경험' },
      { type: 'done', operation: null },
    )
    const s = play(out)
    expect(s.items.map((i) => i.type)).toEqual(['tool', 'file', 'todo', 'diff', 'fit', 'worked'])
    expect(s.items[0]).toMatchObject({ action: '공고 읽기', state: 'err', error: '링크가 열리지 않아요' })
    expect(s.items[1]).toMatchObject({ name: 'resume.pdf', tag: 'PDF', url: '/conversations/c/artifacts/resume.pdf' })
    expect(s.items[2]).toMatchObject({ id: 'todo', items: [{ label: '공고 읽기', state: 'done' }, { label: '이력서 고치기', state: 'now' }] })
    expect(s.items[3]).toMatchObject({ lines: [{ n: 3, sign: '+', text: 'Kotlin' }, { sign: '', text: '...' }] })
    expect(s.items[4]).toMatchObject({
      score: 7.5,
      caption: 'Kafka 경험',
      rows: [{ label: '기술 스택', score: 8 }, { label: '경험 연관성', score: 6 }, { label: '키워드', score: 7 }],
    })
  })

  it('updates a running tool in place across two streams, keyed by tool name', async () => {
    const first = await map(
      { type: 'tool', name: 'edit_doc', state: 'wait', summary: '이력서 고치기' },
      { type: 'done', operation: null, awaiting: 'approval' },
    )
    const second = await map({ type: 'tool', name: 'edit_doc', state: 'ok', summary: '이력서 고치기' }, { type: 'done', operation: null })
    const s = play([{ type: 'start', at: 0 }, ...first, { type: 'start', at: 1 }, ...second])
    expect(s.items.filter((i) => i.type === 'tool')).toMatchObject([{ action: '이력서 고치기', state: 'ok' }])
    const again = play([{ type: 'tool', id: 'x', name: 'edit_doc', action: '다시 고치기', state: 'run' }], s)
    expect(again.items.filter((i) => i.type === 'tool')).toHaveLength(2)
  })

  it('keeps server option ids on approvals and choices', async () => {
    const [ap] = await map({ type: 'approval', id: 'ap1', kind: 'TOOL_ACTION', title: '메일을 보낼까요?', options: [{ id: 'approve', label: '실행' }, { id: 'reject', label: '취소' }] })
    expect(ap).toMatchObject({ type: 'approval', approval: { id: 'ap1', question: '메일을 보낼까요?', optionIds: ['approve', 'reject'] } })
    const s = play([ap!])
    expect(s.approval?.sections[0]).toMatchObject({ kind: 'choices', items: [{ label: '실행' }, { label: '취소' }, { label: '직접 말하기' }] })
    const [ch] = await map({ type: 'choice', id: 'g1', options: [{ id: 'more', label: '더 하기' }, { id: 'cancel', label: '그만하기' }], recommended: 'more' })
    expect(ch).toMatchObject({ type: 'approval', approval: { id: 'g1', optionIds: ['more', 'cancel'] } })
  })

  it('records an auto choice as a line without a panel', async () => {
    const s = play(await map({ type: 'choice', id: 'g', options: [{ id: 'more', label: '더 하기' }, { id: 'cancel', label: '그만하기' }], recommended: 'more', auto: true }))
    expect(s.approval).toBeNull()
    expect(s.items).toMatchObject([{ type: 'agentText', text: '자동으로 골랐어요: 더 하기' }])
  })

  it('tracks done.awaiting until the next start or answer', async () => {
    const s = play([{ type: 'start', at: 0 }, ...(await map({ type: 'done', operation: null, awaiting: 'choice' }))])
    expect(s.awaiting).toBe('choice')
    expect(applyEvent(s, { type: 'start', at: 1 }).awaiting).toBeNull()
    expect(applyEvent(s, { type: 'answer', text: '네' }).awaiting).toBeNull()
  })

  it('ends the run on cancelled', async () => {
    const out = await map({ type: 'tool', name: 't', state: 'run', summary: '찾기' }, { type: 'cancelled' }, { type: 'token', text: 'x' })
    const s = play([{ type: 'start', at: 0 }, ...out])
    expect(s.working).toBeNull()
    expect(s.items.some((i) => i.type === 'agentText')).toBe(false)
  })

  it('explains pre-stream errors', () => {
    expect(errorText('INSUFFICIENT_CREDITS')).toBe('크레딧이 모자라요. 요금제에서 충전할 수 있어요.')
    expect(errorText('QUEUE_BUSY', 30)).toBe('지금 요청이 많아요. 30초 뒤에 다시 보내 주세요.')
    expect(errorText('PLAN_REQUIRED')).toContain('요금제')
    expect(errorText('INTEGRATION_REQUIRED')).toBe('AI 키를 연결해야 쓸 수 있어요.')
  })
})
