import type { BotColor } from './types'

/** The 11 swatches of BotNew and BotProfileColor, in board order. */
export const BOT_COLORS = ['teal', 'sky', 'blue', 'violet', 'pink', 'red', 'coral', 'amber', 'green', 'brown', 'gray'] as const satisfies readonly BotColor[]

/** The bot home polls this often while one of its bots has a run under way (RULINGS 1). */
export const LIVE_POLL_MS = 3000

/** The home row line of a bot whose last run ended without an answer (AgentHomeRowExpiredFailed). */
export const OUTCOME_LINE = { expired: '승인 요청이 만료됐어요', failed: '작업을 끝내지 못했어요. 다시 시도해 주세요.' } as const

/** Spoken after the bot's name on a home row, because the mascot state has no visible label (AgentHomeMascot). */
export const MASCOT_LABEL = {
  help: '확인 필요',
  done: '완료 안 읽음',
  work: '작업 중',
  think: '생각 중',
  idle: '대기',
} as const
