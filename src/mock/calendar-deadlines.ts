import type { Posting } from '@push/api-client'
import type { CalendarEvent } from '@/features/my'

type Entry = { event: CalendarEvent; applied: boolean }

const entries = new Map<string, Entry>()

/** push-be: the deadline is a date, and its event is the last minute of that day. A posting without a deadline, or past it, adds none. */
const eventOf = (p: Posting): CalendarEvent | null => {
  if (!p.deadline) return null
  const [y, m, d] = p.deadline.split('-').map(Number)
  const at = new Date(y!, m! - 1, d!, 23, 59)
  if (at.getTime() < Date.now()) return null
  return {
    id: `deadline-${p.id}`,
    type: 'DEADLINE',
    title: `${p.company} ${p.title}`,
    startsAt: at.toISOString(),
    endsAt: new Date(at.getTime() + 60_000).toISOString(),
    notes: '',
  }
}

export const putDeadlineEvent = (p: Posting, applied = false) => {
  const prev = entries.get(p.id)
  const event = prev?.event ?? eventOf(p)
  if (event) entries.set(p.id, { event, applied: applied || (prev?.applied ?? false) })
}

/** An applied posting keeps its event, whatever happens to the bookmark. */
export const dropDeadlineEvent = (postingId: string) => {
  if (!entries.get(postingId)?.applied) entries.delete(postingId)
}

export const deadlineEvents = () => [...entries.values()].map((e) => e.event)

export const resetDeadlineEvents = () => entries.clear()
