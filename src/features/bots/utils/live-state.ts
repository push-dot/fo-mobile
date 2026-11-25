import { FAILED_LINE, LIVE_POLL_MS, MASCOT_LABEL } from '../constants'
import type { Bot, BotActivity, BotOutcome, BotRow, LocalActivity, MascotState } from '../types'
import { homeRowLabel } from './home-rows'
import { rowTime } from './row-time'

type Facts = { activity: BotActivity; unread: boolean; outcome: BotOutcome | null }

export const MASCOT_PRIORITY = ['help', 'done', 'work', 'think', 'idle'] as const satisfies readonly MascotState[]

const SHOWS: Record<MascotState, (f: Facts) => boolean> = {
  help: (f) => f.activity.phase === 'waiting' || f.outcome?.kind === 'failed',
  done: (f) => f.unread,
  work: (f) => f.activity.phase === 'working',
  think: (f) => f.activity.phase === 'thinking' || f.activity.phase === 'queued',
  idle: () => true,
}

export const mascotStateOf = (facts: Facts): MascotState => MASCOT_PRIORITY.find((s) => SHOWS[s](facts)) ?? 'idle'

export const mergeFacts = (bot: Bot, local: LocalActivity | undefined): Facts => ({
  activity: local?.streaming ?? bot.activity,
  unread: local?.reading ? false : bot.unread,
  outcome: local?.streaming ? null : bot.outcome,
})

const lineOf = ({ activity, outcome }: Facts, bot: Bot): string => {
  if (activity.phase === 'waiting') return activity.cardTitle
  if (activity.phase === 'working') return activity.label
  if (activity.phase === 'thinking' && activity.label) return activity.label
  if (activity.phase === 'idle' && outcome) return FAILED_LINE
  return bot.lastMessage?.preview ?? ''
}

export const botRow = (bot: Bot, local: LocalActivity | undefined, now: Date, shown?: string): BotRow => {
  const facts = mergeFacts(bot, local)
  const mascot = mascotStateOf(facts)
  const line = shown || lineOf(facts, bot)
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

export const pollIntervalOf = (bots: readonly Bot[] | undefined, live: boolean): number | false =>
  live && (bots ?? []).some((b) => RUN_PHASES.has(b.activity.phase)) ? LIVE_POLL_MS : false
