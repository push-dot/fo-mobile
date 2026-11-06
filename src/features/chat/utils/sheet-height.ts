const SHEET_TOP_GAP = 16
const MIN_SCROLL = 96

/**
 * Max height for the scroll body of a fit-to-contents sheet: `cap` of the window, but never more than the room the
 * header, CTA, safe area and keyboard leave, so the CTA stays on screen on small phones and with large text.
 * `chrome` is the sheet height minus the scroll height.
 */
export const sheetScrollMax = (windowHeight: number, insetTop: number, keyboard: number, chrome: number, cap: number) =>
  Math.max(MIN_SCROLL, Math.min(windowHeight * cap, windowHeight - insetTop - SHEET_TOP_GAP - keyboard - chrome))
