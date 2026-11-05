import { clock } from './clock'
import { dayLabel } from './day-breaks'
import { dayDiff } from './day-diff'

export const eventWhen = (iso: string, now = new Date()) => {
  const d = new Date(iso)
  const n = dayDiff(d, now)
  return `${n === 0 ? '오늘' : n === 1 ? '내일' : dayLabel(d)} ${clock(iso)}`
}
