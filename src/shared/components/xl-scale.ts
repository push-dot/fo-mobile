export const XL_BOARD_TEXT_SCALE = 1.2
export const isXlBoardText = (fontScale: number) => Math.round(fontScale * 100) >= Math.round(XL_BOARD_TEXT_SCALE * 100)
