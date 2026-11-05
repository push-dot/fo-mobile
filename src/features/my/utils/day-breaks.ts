import { sameDay } from './day-diff'

export const dayLabel = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일`

export const dayBreaks = <T extends { createdAt: string }>(items: T[]) =>
  items.map((item, i) => {
    const at = new Date(item.createdAt)
    const prev = items[i - 1]
    return { ...item, day: prev && sameDay(new Date(prev.createdAt), at) ? null : dayLabel(at) }
  })
