const DAY = 86_400_000
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

/** 10분 전 · 2시간 전 · 오전 9:00 · 어제 · 10월 17일 (Notifications board). */
export const timeLabel = (iso: string, now = new Date()) => {
  const t = new Date(iso)
  const min = Math.floor((now.getTime() - t.getTime()) / 60_000)
  const days = Math.round((startOfDay(now) - startOfDay(t)) / DAY)
  if (days === 0) {
    if (min < 1) return '방금'
    if (min < 60) return `${min}분 전`
    if (min < 180) return `${Math.floor(min / 60)}시간 전`
    const h = t.getHours()
    return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${String(t.getMinutes()).padStart(2, '0')}`
  }
  if (days === 1) return '어제'
  return `${t.getMonth() + 1}월 ${t.getDate()}일`
}

/** 오늘 · 이번 주 · 이전 */
export const groupLabel = (iso: string, now = new Date()) => {
  const days = Math.round((startOfDay(now) - startOfDay(new Date(iso))) / DAY)
  return days === 0 ? '오늘' : days < 7 ? '이번 주' : '이전'
}
