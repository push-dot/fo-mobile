// The page-read card (ChatBotStatusApprove): a bot asks to open a company page, three answers, no time limit.
import type { BotContract } from '@push/api-client'
import type { MockCard } from '../bots'

type Frame = BotContract.StreamEvent

/** The draft a resumed chat shows with its offer (ChatResume): markdown, as the bot writes it. */
export const DRAFT_V1_MD = [
  '**김서준 · 백엔드 개발자**',
  '**모아페이 · 백엔드 엔지니어 · 2022.03–현재**',
  '• 결제 승인 API를 Kotlin·Spring으로 재설계, p95 응답 320ms → 140ms',
  '• Kafka 기반 결제 이벤트 파이프라인 구축',
  '[초안 전체 보기](/docs/push/d1) ›',
].join('\n')

/** A message with these words makes the mock bot ask to open a page instead of answering. */
export const PAGE_READ_TRIGGER = '채용 페이지'

export const PAGE_READ_OPTIONS: MockCard['options'] = [
  { id: 'approve', label: '한 번 허용' },
  { id: 'approve_always', label: '항상 허용', desc: '이 Bot이 이 사이트를 읽을 때 다시 묻지 않아요' },
  { id: 'reject', label: '거절' },
]

export const pageReadCard = (id: string, turn: string, company: string, host: string, now: Date): MockCard => ({
  id,
  turn,
  for: 'confirm',
  title: `${company} 채용 페이지를 열어도 될까요?`,
  status: 'PENDING',
  at: now.toISOString(),
  expiresAt: null,
  options: PAGE_READ_OPTIONS,
  summary: `${host} · 공고 1개를 읽어요`,
})

/** What the stream sends for the ask: the waiting status, the card, then the end of the turn. */
export const pageReadFrames = (card: MockCard, turn: string, now: Date, firstSeq: number): Frame[] => {
  const at = now.toISOString()
  const stamp = (n: number) => ({ seq: firstSeq + n, turn, at })
  return [
    { type: 'status', text: '확인을 기다리고 있어요', phase: 'waiting', since: at, for: 'confirm', cardId: card.id, ...stamp(0) },
    {
      type: 'approval',
      id: card.id,
      kind: 'TOOL_ACTION',
      title: card.title,
      summary: card.summary!,
      options: card.options,
      ...stamp(1),
    },
    { type: 'done', operation: null, awaiting: 'approval', ...stamp(2) },
  ]
}
