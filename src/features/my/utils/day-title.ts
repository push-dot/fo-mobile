import { WEEKDAYS } from '../constants'
import { dayDiff } from './day-diff'

export const dayTitle = (d: Date, now = new Date()) => {
  const base = `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAYS[d.getDay()]}요일`
  const n = dayDiff(d, now)
  return n === 0 ? `${base} · 오늘` : n === 1 ? `${base} · 내일` : base
}
