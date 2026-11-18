const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

/** A home row's time: "방금", "10분 전", "1시간 전", "어제", "10월 28일", and the year when it is not this year ("2025. 12. 3."). */
export const rowTime = (at: Date, now: Date): string => {
  const diff = Math.max(0, now.getTime() - at.getTime())
  if (diff < MIN) return '방금'
  if (diff < HOUR) return `${Math.floor(diff / MIN)}분 전`
  if (diff < DAY) return `${Math.floor(diff / HOUR)}시간 전`
  if (diff < 2 * DAY) return '어제'
  const day = `${at.getMonth() + 1}월 ${at.getDate()}일`
  return at.getFullYear() === now.getFullYear() ? day : `${at.getFullYear()}. ${at.getMonth() + 1}. ${at.getDate()}.`
}
