import type { ConversationTurn, Message } from '@push/api-client'
import { describe, expect, it } from 'vitest'
import { restoreTurns } from '../utils/turns'

const msg = (id: string, role: Message['role'], text: string): Message => ({
  id, conversationId: 'c', role, text, attachments: [], operationId: null, createdAt: '2026-11-05T00:00:00Z',
})
const turn = (jobId: string, events: ConversationTurn['events'], more: Partial<ConversationTurn> = {}): ConversationTurn => ({
  jobId, status: 'DONE', createdAt: '2026-11-05T00:00:00Z', userMessageId: null, assistantMessageId: null, answer: null, events, ...more,
})

const GATE: ConversationTurn['events'][number] = {
  type: 'choice', id: 'g1', gate: 'analyze', title: '이 공고에 맞춰 이력서를 고칠까요?',
  options: [{ id: 'tailor', label: '네, 맞춰서 고쳐 주세요' }, { id: 'feedback', label: '피드백만 받을게요' }],
  resolution: { status: 'APPROVED', optionId: 'tailor' }, seq: 4,
}

describe('restoreTurns', () => {
  it('draws the cards of every turn oldest first, with the answered option as the user bubble', () => {
    const turns = [
      // Newest first, like GET .../turns.
      turn('j2', [
        { type: 'tool', name: 'edit_document', state: 'ok', summary: '이력서 수정', target: '경력 · 모아페이', seq: 7 },
        { type: 'token', text: '경력 섹션을 고쳤어요.', seq: 8 },
      ], { answer: { approvalId: 'g1', optionId: 'tailor' } }),
      turn('j1', [
        { type: 'todo', id: 'analyze', items: [{ id: 'resume', text: '이력서 읽기', state: 'done' }], seq: 1 },
        { type: 'tool', name: 'read_resume', state: 'ok', summary: '이력서 읽기', target: 'a.pdf', resultLine: '2쪽', seq: 2 },
        { type: 'token', text: '분석했어요.', seq: 3 },
        GATE,
      ], { userMessageId: 'm1' }),
    ]
    const s = restoreTurns(turns, [msg('m1', 'USER', '모아페이에 맞춰 줘')])
    expect(s.items.map((i) => i.type)).toEqual(['user', 'todo', 'tool', 'agentText', 'user', 'tool', 'agentText'])
    expect(s.items).toMatchObject([
      { text: '모아페이에 맞춰 줘' },
      { items: [{ label: '이력서 읽기', state: 'done' }] },
      { action: '이력서 읽기', target: 'a.pdf', result: '2쪽' },
      { text: '분석했어요.' },
      { text: '네, 맞춰서 고쳐 주세요' },
      { action: '이력서 수정', target: '경력 · 모아페이' },
      { text: '경력 섹션을 고쳤어요.' },
    ])
    expect(s.approval).toBeNull()
    expect(s.working).toBeNull()
  })

  it('reopens a card that is still waiting for an answer', () => {
    const s = restoreTurns(
      [
        turn('j1', [
          {
            type: 'approval', id: 'ap', kind: 'DOCUMENT_EDIT', title: '이 수정을 적용할까요?',
            options: [{ id: 'apply', label: '적용' }, { id: 'skip', label: '그대로 두기' }],
            hunks: [{ line: 3, sign: '+', text: 'Kafka' }], resolution: { status: 'PENDING', optionId: null }, seq: 5,
          },
        ]),
      ],
      [],
    )
    expect(s.items).toMatchObject([{ type: 'diff', lines: [{ text: 'Kafka' }] }])
    expect(s.approval).toMatchObject({ id: 'ap', submit: '적용' })
    expect(s.awaiting).toBe('approval')
  })

  it('joins picked labels for a multi answer and falls back to the assistant message without tokens', () => {
    const multi: ConversationTurn['events'][number] = {
      type: 'choice', id: 'g2', multiple: true, title: '어떤 산출물을 만들까요?',
      options: [{ id: 'resume', label: '이력서' }, { id: 'portfolio', label: '포트폴리오' }],
      resolution: { status: 'APPROVED', optionId: 'resume', optionIds: ['resume', 'portfolio'] }, seq: 1,
    }
    const s = restoreTurns(
      [
        turn('j2', [], { answer: { approvalId: 'g2', optionId: 'resume', optionIds: ['resume', 'portfolio'] }, assistantMessageId: 'a2' }),
        turn('j1', [multi]),
      ],
      [msg('a2', 'ASSISTANT', '두 가지를 만들게요.')],
    )
    expect(s.items).toMatchObject([
      { type: 'user', text: '이력서, 포트폴리오' },
      { type: 'agentText', text: '두 가지를 만들게요.' },
    ])
  })

  it('a section card answer replays as the label the app showed', () => {
    const INTAKE: ConversationTurn['events'][number] = {
      type: 'choice', id: 'g0', gate: 'output_targets', title: '어떤 산출물을 만들까요?', multiple: true,
      options: [{ id: 'resume', label: '이력서' }, { id: 'portfolio', label: '포트폴리오' }, { id: 'cancel', label: '그만하기' }],
      sections: [
        { id: 'targets', kind: 'chips', title: '어떤 산출물을 만들까요?', multiple: true, options: [{ id: 'resume', label: '이력서' }, { id: 'portfolio', label: '포트폴리오' }], selected: ['resume'] },
        { id: 'materials', kind: 'rows', title: '가져올 자료', options: [{ id: 'm_file', label: 'a.pdf', sub: '마이 › 서류', action: 'change' }] },
        { id: 'tone', kind: 'chips', title: '어떤 말투로 쓸까요?', options: [{ id: 'concise', label: '짧게' }, { id: 'preserve', label: '원래 말투로' }], selected: ['preserve'] },
      ],
      submit: { label: '다음' },
      resolution: { status: 'APPROVED', optionId: 'submit', optionIds: ['submit', 'resume', 'preserve'] }, seq: 2,
    }
    const turns = [
      turn('j2', [{ type: 'token', text: '이대로 분석을 시작할까요?', seq: 3 }], { answer: { approvalId: 'g0', optionId: 'submit', optionIds: ['submit', 'resume', 'preserve'] } }),
      turn('j1', [INTAKE], { userMessageId: 'm1' }),
    ]
    const s = restoreTurns(turns, [msg('m1', 'USER', '이력서 고쳐 줘')])
    expect(s.items.filter((i) => i.type === 'user').map((i) => i.type === 'user' && i.text)).toEqual(['이력서 고쳐 줘', '이력서만 · 자료 1개 · 원래 말투로'])
  })
})
