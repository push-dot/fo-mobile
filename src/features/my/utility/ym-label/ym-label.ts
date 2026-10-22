export const ymLabel = (ym: string) => {
  const [y, m] = ym.split('-')
  return `${y}년 ${Number(m)}월`
}
