import type { BotColor } from './types'

export const BOT_COLORS = ['teal', 'sky', 'blue', 'violet', 'pink', 'red', 'coral', 'amber', 'green', 'brown', 'gray'] as const satisfies readonly BotColor[]

export const LIVE_POLL_MS = 3000

export const FAILED_LINE = '작업을 끝내지 못했어요. 다시 시도해 주세요.'

export const MASCOT_LABEL = {
  help: '확인 필요',
  done: '완료 안 읽음',
  work: '작업 중',
  think: '생각 중',
  idle: '대기',
} as const
