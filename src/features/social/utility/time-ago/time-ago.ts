import { DAY, HOUR, MIN } from '../../constants'

export const timeAgo = (iso: string, now: Date = new Date()) => {
  const d = new Date(iso)
  const diff = Math.max(0, now.getTime() - d.getTime())
  if (diff < MIN) return '방금 전'
  if (diff < HOUR) return `${Math.floor(diff / MIN)}분 전`
  if (diff < DAY) return `${Math.floor(diff / HOUR)}시간 전`
  if (diff < 2 * DAY) return '어제'
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}일 전`
  if (d.getFullYear() === now.getFullYear()) return `${d.getMonth() + 1}월 ${d.getDate()}일`
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`
}
