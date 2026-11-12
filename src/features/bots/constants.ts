import type { BotColor } from './types'

/** The 11 swatches of BotNew and BotProfileColor, in board order. */
export const BOT_COLORS = ['teal', 'sky', 'blue', 'violet', 'pink', 'red', 'coral', 'amber', 'green', 'brown', 'gray'] as const satisfies readonly BotColor[]

/** The bot home polls this often while one of its bots has a run under way (RULINGS 1). */
export const LIVE_POLL_MS = 3000

/** Spoken after the bot's name on a home row, because the mascot state has no visible label (AgentHomeMascot). */
export const MASCOT_LABEL = {
  help: '확인 필요',
  done: '완료 안 읽음',
  work: '작업 중',
  think: '생각 중',
  idle: '대기',
} as const
