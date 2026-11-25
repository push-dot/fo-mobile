const SHEET_TOP_GAP = 16
const MIN_SCROLL = 96

export const sheetScrollMax = (windowHeight: number, insetTop: number, keyboard: number, chrome: number, cap: number, scale = 1) =>
  Math.max(MIN_SCROLL, Math.min(windowHeight * cap, (windowHeight - insetTop - SHEET_TOP_GAP - keyboard) / scale - chrome))
