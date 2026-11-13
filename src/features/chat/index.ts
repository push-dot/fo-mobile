import type { BotId, LocalActivity } from '@/features/bots'

export * from './api'
export * from './components'
export * from './constants'
export * from './hooks'
export * from './stores'
export * from './types'
export * from './utils'

const NO_LOCAL_ACTIVITY: Readonly<Record<BotId, LocalActivity>> = {}

// Stub so the bots lane builds before this lane stores local activity (A5).
/** What this session knows about each bot beyond the bot list. */
export const useLocalActivity = (): Readonly<Record<BotId, LocalActivity>> => NO_LOCAL_ACTIVITY
