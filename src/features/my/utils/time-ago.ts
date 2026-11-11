import { DAY, HOUR, MIN } from '../constants'

const calendarDate = (d: Date, now: Date) =>
  d.getFullYear() === now.getFullYear()
    ? `${d.getMonth() + 1}월 ${d.getDate()}일`
    : `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`

export const timeAgo = (iso: string, now = new Date()) => {
  const d = new Date(iso)
  const diff = Math.max(0, now.getTime() - d.getTime())
  if (diff < MIN) return '방금 전'
  if (diff < HOUR) return `${Math.floor(diff / MIN)}분 전`
  if (diff < DAY) return `${Math.floor(diff / HOUR)}시간 전`
  if (diff < 2 * DAY) return '어제'
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}일 전`
  return calendarDate(d, now)
}

export const postedAt = (iso: string, now = new Date()) => {
  if (now.getTime() - new Date(iso).getTime() < 2 * DAY) return timeAgo(iso, now)
  return calendarDate(new Date(iso), now)
}
