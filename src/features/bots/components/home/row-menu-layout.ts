import { spacing } from '@/theme/tokens'

/** The pop under a held row, in the board's numbers (AgentHomePress: 236 wide, 14 from the right, 16 below the row). */
export const POP = {
  width: 236,
  right: 14,
  gap: spacing[4],
  padding: spacing[2],
  radius: 26,
  item: 44,
  itemPad: 10,
  dividerGap: 4,
  height: (count: number) => 2 * spacing[2] + count * 44 + 9,
}

/** Under the held row; above it when the pop would run past the bottom of the screen. */
export const popTop = (row: { y: number; height: number }, height: number, bottom: number) => {
  const below = row.y + row.height + POP.gap
  return below + height <= bottom ? below : Math.max(0, row.y - POP.gap - height)
}
