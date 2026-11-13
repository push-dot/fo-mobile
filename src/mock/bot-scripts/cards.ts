// The page-read card (ChatBotStatusApprove): a bot asks to open a company page, three answers, ten minutes to reply.
import type { BotContract } from '@push/api-client'
import type { MockCard } from '../bots'

type Frame = BotContract.StreamEvent

/** Server lifetime of a page-read card (push-be harness/approval.py TTL). The app reads it from expiresAt; only the mock states it. */
const PAGE_READ_MINUTES = 10

/** A message with these words makes the mock bot ask to open a page instead of answering. */
export const PAGE_READ_TRIGGER = '채용 페이지'

export const PAGE_READ_OPTIONS: MockCard['options'] = [
  { id: 'approve', label: '한 번 허용' },
  { id: 'approve_always', label: '항상 허용', desc: '이 Bot이 이 사이트를 읽을 때 다시 묻지 않아요' },
  { id: 'reject', label: '거절' },
]

export const PAGE_READ_FOOT = `${PAGE_READ_MINUTES}분 동안 답이 없으면 이 요청은 만료돼요`

export const pageReadCard = (id: string, turn: string, company: string, host: string, now: Date): MockCard => ({
  id,
  turn,
  for: 'confirm',
  title: `${company} 채용 페이지를 열어도 될까요?`,
  status: 'PENDING',
  at: now.toISOString(),
  expiresAt: new Date(now.getTime() + PAGE_READ_MINUTES * 60_000).toISOString(),
  options: PAGE_READ_OPTIONS,
  summary: `${host} · 공고 1개를 읽어요`,
})

/** What the stream sends for the ask: the waiting status, the card with its expiry, then the end of the turn. */
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
      foot: PAGE_READ_FOOT,
      expiresAt: card.expiresAt as string,
      ...stamp(1),
    },
    { type: 'done', operation: null, awaiting: 'approval', ...stamp(2) },
  ]
}
