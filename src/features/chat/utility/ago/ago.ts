export const ago = (iso: string) => {
  const d = new Date(iso)
  const min = Math.floor((Date.now() - d.getTime()) / 60_000)
  if (min < 1) return '방금'
  if (min < 60) return `${min}분 전`
  if (min < 60 * 24) return `${Math.floor(min / 60)}시간 전`
  if (min < 60 * 48) return '어제'
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}
