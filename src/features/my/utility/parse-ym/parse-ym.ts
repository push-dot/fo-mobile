export const parseYm = (text: string) => {
  const m = text.trim().match(/^(\d{4})\D*(\d{1,2})$/)
  if (!m) return null
  const month = Number(m[2])
  return month >= 1 && month <= 12 ? `${m[1]}-${String(month).padStart(2, '0')}` : null
}
