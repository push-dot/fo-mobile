import { dayDiff } from './day-diff'

export const dday = (iso: string, now = new Date()) => {
  const n = dayDiff(new Date(iso), now)
  return n > 0 ? `D-${n}` : n === 0 ? 'D-Day' : '마감'
}
