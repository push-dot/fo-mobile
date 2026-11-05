const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

export const formatMonth = (d: Date) => `${d.getFullYear()}년 ${d.getMonth() + 1}월`

export const formatDay = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`

export const formatTime = (d: Date) => {
  const h = d.getHours()
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`
}

export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)

export const withTime = (day: Date, time: Date) =>
  new Date(day.getFullYear(), day.getMonth(), day.getDate(), time.getHours(), time.getMinutes())

export const toPickerUtc = (d: Date) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString()

export const fromPickerUtc = (d: Date) => new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())

const FIRST_YEAR = 1970

export const yearsBetween = (min?: Date, max?: Date) => {
  const from = min?.getFullYear() ?? FIRST_YEAR
  const to = (max ?? new Date()).getFullYear()
  return Array.from({ length: to - from + 1 }, (_, i) => to - i)
}

export const clampMonth = (d: Date, min?: Date, max?: Date) => {
  if (min && d < startOfMonth(min)) return startOfMonth(min)
  if (max && d > startOfMonth(max)) return startOfMonth(max)
  return d
}
