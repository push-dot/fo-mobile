export const GRID_CARD_MAX = 169
const GRID_PADDING = 20
const GRID_GAP = 12

export const gridCardWidth = (screenWidth: number) => Math.min(GRID_CARD_MAX, Math.floor((screenWidth - GRID_PADDING * 2 - GRID_GAP) / 2))

export const gridFillWidth = (screenWidth: number) => Math.floor((screenWidth - GRID_PADDING * 2 - GRID_GAP) / 2)
