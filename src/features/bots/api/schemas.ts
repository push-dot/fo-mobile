import type { BotContract } from '@push/api-client'
import type { Bot, BotActivity, BotOutcome, BotId, BotProfile, BotSearch, CardId, CompanyBot, LinkCheck } from '../types'
import { colorOf, dateOf, dayOf, toBotRef } from '../utils/wire'

// With utils/wire, the only place that reads bot wire field names. Wire types stop here.

export { dayOf }

/** Null when a date does not parse. */
const activityOf = (a: BotContract.BotActivity | null): BotActivity | null => {
  if (a === null) return { phase: 'idle' }
  const since = dateOf(a.since)
  if (!since) return null
  switch (a.phase) {
    case 'queued':
      return { phase: 'queued', since, ahead: a.ahead }
    case 'thinking':
      return { phase: 'thinking', since, label: a.label }
    case 'working':
      return { phase: 'working', since, label: a.label }
    case 'waiting': {
      const expiresAt = a.expiresAt === null ? null : dateOf(a.expiresAt)
      if (a.expiresAt !== null && !expiresAt) return null
      return { phase: 'waiting', since, for: a.for, cardId: a.cardId as CardId, cardTitle: a.cardTitle, expiresAt }
    }
  }
}

/** Undefined when the date does not parse, null when the bot has no outcome. */
const outcomeOf = (o: BotContract.BotOutcome | null): BotOutcome | null | undefined => {
  if (o === null) return null
  const at = dateOf(o.at)
  return at ? { kind: o.kind, at } : undefined
}

/** Null for a row whose dates do not parse: a list drops it instead of drawing it half-built. */
export const toBot = (dto: BotContract.Bot): Bot | null => {
  const lastActivityAt = dateOf(dto.lastActivityAt)
  const activity = activityOf(dto.activity)
  const outcome = outcomeOf(dto.outcome)
  if (!lastActivityAt || !activity || outcome === undefined) return null
  const common = {
    id: dto.id as BotId,
    name: dto.displayName,
    muted: dto.notificationsMuted,
    revision: dto.revision,
    lastActivityAt,
    lastMessage: dto.lastMessage && { preview: dto.lastMessage.preview, fromBot: dto.lastMessage.fromBot },
    unread: dto.unread,
    activity,
    outcome,
  }
  return dto.kind === 'push' ? { ...common, kind: 'push' } : { ...common, kind: 'company', color: colorOf(dto.color), postingId: dto.postingId }
}

export const toBots = (dtos: readonly BotContract.Bot[]): Bot[] => dtos.flatMap((dto) => toBot(dto) ?? [])

const must = <T>(value: T | null, what: string): T => {
  if (value === null) throw new Error(`unreadable ${what}`)
  return value
}

export const toCompanyBot = (dto: BotContract.Bot): CompanyBot => {
  const bot = must(toBot(dto), 'bot')
  if (bot.kind !== 'company') throw new Error('expected a company bot')
  return bot
}

export const toOneBot = (dto: BotContract.Bot): Bot => must(toBot(dto), 'bot')

export const toBotProfile = (dto: BotContract.BotDetail): BotProfile => ({
  bot: toOneBot(dto),
  posting: dto.posting && { id: dto.posting.id, title: dto.posting.title, deadline: dayOf(dto.posting.deadline), closed: dto.posting.closed },
  fitScore: dto.fit?.score ?? null,
  materialCount: dto.materialCount ?? null,
})

export const toLinkCheck = (dto: BotContract.LinkPreview): LinkCheck =>
  dto.status === 'found' ? { ...dto, deadline: dayOf(dto.deadline) } : { status: 'not_a_posting' }

export const toBotSearch = (dto: BotContract.BotSearch): BotSearch => ({
  bots: dto.bots.flatMap((row) => {
    const bot = toBot(row)
    return bot ? [{ bot, line: row.line }] : []
  }),
  botTotal: dto.botTotal,
  messages: dto.messages.flatMap((m) => {
    const at = dateOf(m.at)
    return at ? [{ bot: toBotRef(m.bot), messageId: m.messageId, at, fromBot: m.role === 'ASSISTANT', snippet: m.snippet }] : []
  }),
  messageTotal: dto.messageTotal,
})
