/** The boards draw the job grid as `repeat(2, 169px)` with a 12pt gap and 20pt side padding; narrower screens shrink the cards, wider ones keep 169 and leave the slack on the right. */
export const GRID_CARD_MAX = 169
const GRID_PADDING = 20
const GRID_GAP = 12

export const gridCardWidth = (screenWidth: number) => Math.min(GRID_CARD_MAX, Math.floor((screenWidth - GRID_PADDING * 2 - GRID_GAP) / 2))
