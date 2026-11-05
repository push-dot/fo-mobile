export const ymToDate = (text: string): Date | null => {
  const ym = parseYm(text)
  if (!ym) return null
  const [year, month] = ym.split('-').map(Number)
  return new Date(year!, month! - 1, 1)
}

export const dateToYm = (d: Date) => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`

export const parseYm = (text: string) => {
  const m = text.trim().match(/^(\d{4})\D*(\d{1,2})$/)
  if (!m) return null
  const month = Number(m[2])
  return month >= 1 && month <= 12 ? `${m[1]}-${String(month).padStart(2, '0')}` : null
}
