import { LIVE_POLL_MS, MASCOT_LABEL } from '../constants'
import type { Bot, BotActivity, BotRow, LocalActivity, MascotState } from '../types'
import { homeRowLabel } from './home-rows'
import { rowTime } from './row-time'

type Facts = { activity: BotActivity; unread: boolean }

/** AgentHomeMascot: "확인 필요 → 완료 안 읽음 → 작업 중 → 생각 중 → 대기 순으로 하나만 보여 줘요." The order is the rule. */
export const MASCOT_PRIORITY = ['help', 'done', 'work', 'think', 'idle'] as const satisfies readonly MascotState[]

const SHOWS: Record<MascotState, (f: Facts) => boolean> = {
  help: (f) => f.activity.phase === 'waiting',
  done: (f) => f.unread,
  work: (f) => f.activity.phase === 'working',
  // A queued run shows as thinking: the bot took the request and has not started a step.
  think: (f) => f.activity.phase === 'thinking' || f.activity.phase === 'queued',
  idle: () => true,
}

export const mascotStateOf = (facts: Facts): MascotState => MASCOT_PRIORITY.find((s) => SHOWS[s](facts)) ?? 'idle'

/** A card past its time is open nowhere. The server drops it at fetch time, this drops it between two fetches. */
export const expiredAt = (activity: BotActivity, now: Date): BotActivity =>
  activity.phase === 'waiting' && activity.expiresAt !== null && activity.expiresAt.getTime() <= now.getTime() ? { phase: 'idle' } : activity

/**
 * Server facts and this session's facts, merged at read time. No clock decides which side is fresher:
 * the session's stream wins while it is held, and the server wins otherwise.
 */
export const mergeFacts = (bot: Bot, local: LocalActivity | undefined, now: Date): Facts => ({
  activity: local?.streaming ?? expiredAt(bot.activity, now),
  unread: local?.reading ? false : bot.unread,
})

const lineOf = (activity: BotActivity, bot: Bot): string => {
  if (activity.phase === 'waiting') return activity.cardTitle
  if (activity.phase === 'working') return activity.label
  if (activity.phase === 'thinking' && activity.label) return activity.label
  return bot.lastMessage?.preview ?? ''
}

export const botRow = (bot: Bot, local: LocalActivity | undefined, now: Date): BotRow => {
  const facts = mergeFacts(bot, local, now)
  const mascot = mascotStateOf(facts)
  const line = lineOf(facts.activity, bot)
  const time = rowTime(bot.lastActivityAt, now)
  return {
    id: bot.id,
    name: bot.name,
    color: bot.kind === 'push' ? 'push' : bot.color,
    mascot,
    unreadDot: mascot === 'done',
    line,
    time,
    accessibilityLabel: bot.kind === 'push' ? `${bot.name}, ${MASCOT_LABEL[mascot]}` : homeRowLabel({ name: bot.name, mascot, line, time }),
  }
}

const RUN_PHASES: ReadonlySet<BotActivity['phase']> = new Set(['queued', 'thinking', 'working'])

/**
 * The bot home polls only while it is live (focused) and some bot has a run under way. A bot that waits for the
 * user does not keep the poll alive: the answer comes from this session, or its card expires by the clock.
 */
export const pollIntervalOf = (bots: readonly Bot[] | undefined, live: boolean): number | false =>
  live && (bots ?? []).some((b) => RUN_PHASES.has(b.activity.phase)) ? LIVE_POLL_MS : false
