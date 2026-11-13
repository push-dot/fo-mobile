import type { BotContract } from '@push/api-client'
import { BOT_COLORS } from '../constants'
import type { BotColor, BotId, BotRef } from '../types'

// The wire readers that bot and material answers share. Each answers null for a value it cannot read, and its caller
// drops the row, so no screen draws an Invalid Date or a colour the app has no swatch for.

export const dateOf = (iso: string): Date | null => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

/** A posting deadline is a calendar day ("2026-11-20"). Read as local midnight, so the day does not shift with the zone. */
export const dayOf = (value: string | null): Date | null => {
  if (value === null) return null
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return day ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3])) : dateOf(value)
}

export const colorOf = (color: BotColor | null): BotColor => (color !== null && (BOT_COLORS as readonly string[]).includes(color) ? color : 'gray')

export const toBotRef = (ref: BotContract.BotRef): BotRef => ({
  id: ref.id as BotId,
  kind: ref.kind,
  name: ref.displayName,
  color: ref.kind === 'push' ? null : colorOf(ref.color),
})
