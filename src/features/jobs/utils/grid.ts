import { spacing } from '../../../theme'

/** The boards draw the job grid as `repeat(2, 169px)` with a 12pt gap; narrower screens shrink the cards, wider ones keep 169 and leave the slack on the right. */
export const GRID_CARD_MAX = 169

export const gridCardWidth = (screenWidth: number) => Math.min(GRID_CARD_MAX, Math.floor((screenWidth - spacing[5] * 2 - spacing[3]) / 2))
