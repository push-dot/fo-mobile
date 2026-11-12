import type { Attachment, BotId, LocalActivity } from '@/features/bots'

export * from './api'
export * from './components'
export * from './constants'
export * from './hooks'
export * from './stores'
export * from './types'
export * from './utils'

const NO_LOCAL_ACTIVITY: Readonly<Record<BotId, LocalActivity>> = {}

// Stubs with the final names, so the bots and materials lanes build before the chat lane implements them (A5, A7).
/** What this session knows about each bot beyond the bot list. */
export const useLocalActivity = (): Readonly<Record<BotId, LocalActivity>> => NO_LOCAL_ACTIVITY
/** Puts a material on one bot's composer. */
export const attach: (botId: BotId, attachment: Attachment) => void = () => {}
