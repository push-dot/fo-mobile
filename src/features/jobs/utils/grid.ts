/** The boards draw the job grid as `repeat(2, 169px)` with a 12pt gap and 20pt side padding; narrower screens shrink the cards, wider ones keep 169 and leave the slack on the right. */
export const GRID_CARD_MAX = 169
const GRID_PADDING = 20
const GRID_GAP = 12

export const gridCardWidth = (screenWidth: number) => Math.min(GRID_CARD_MAX, Math.floor((screenWidth - GRID_PADDING * 2 - GRID_GAP) / 2))

/** JobListLoading draws `repeat(2,minmax(0,1fr))` (no 169 cap): (402-52)/2 = 175pt, so the skeleton fills the row. */
export const gridFillWidth = (screenWidth: number) => Math.floor((screenWidth - GRID_PADDING * 2 - GRID_GAP) / 2)
