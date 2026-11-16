import type { Posting } from '@push/api-client'
import type { CalendarEvent } from '@/features/my'

type Entry = { event: CalendarEvent; applied: boolean }

const entries = new Map<string, Entry>()

const eventOf = (p: Posting, applied: boolean): CalendarEvent | null => {
  if (!p.deadline) return null
  const at = new Date(`${p.deadline.slice(0, 10)}T23:59:00+09:00`)
  if (!applied && at.getTime() < Date.now()) return null
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
  const event = prev?.event ?? eventOf(p, applied)
  if (event) entries.set(p.id, { event, applied: applied || (prev?.applied ?? false) })
}

export const dropDeadlineEvent = (postingId: string) => {
  if (!entries.get(postingId)?.applied) entries.delete(postingId)
}

export const deadlineEvents = () => [...entries.values()].map((e) => e.event)

export const resetDeadlineEvents = () => entries.clear()
