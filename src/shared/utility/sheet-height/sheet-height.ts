const SHEET_TOP_GAP = 16
const MIN_SCROLL = 96

/**
 * Max height for the scroll body of a fit-to-contents sheet: `cap` of the window, but never more than the room the
 * header, CTA, safe area and keyboard leave, so the CTA stays on screen on small phones and with large text.
 * `chrome` is the sheet height minus the scroll height. `scale` is the float scale of an iOS 26 partial sheet (floatingSheet): UIKit sizes the
 * sheet from the unscaled height, so content `scale` times as tall as the room attaches the sheet to the top and every row draws that much larger.
 */
export const sheetScrollMax = (windowHeight: number, insetTop: number, keyboard: number, chrome: number, cap: number, scale = 1) =>
  Math.max(MIN_SCROLL, Math.min(windowHeight * cap, (windowHeight - insetTop - SHEET_TOP_GAP - keyboard) / scale - chrome))
