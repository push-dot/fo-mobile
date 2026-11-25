export const moveItem = <T>(xs: readonly T[], from: number, to: number): T[] => {
  const next = [...xs]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item as T)
  return next
}

export const dropIndex = (heights: readonly number[], from: number, dy: number, gap: number) => {
  const dir = dy > 0 ? 1 : -1
  let to = from
  let travel = 0
  for (let j = from + dir; j >= 0 && j < heights.length; j += dir) {
    const step = heights[j]! + gap
    if (Math.abs(dy) <= travel + step / 2) break
    to = j
    travel += step
  }
  return to
}

export const indexAfterMove = (index: number | null, from: number, to: number) => {
  if (index === null) return null
  if (index === from) return to
  if (from < index && index <= to) return index - 1
  if (to <= index && index < from) return index + 1
  return index
}
