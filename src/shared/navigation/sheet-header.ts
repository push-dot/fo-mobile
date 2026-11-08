// The boards centre an Android page sheet's header at 52pt from the top edge, status bar included.
const ANDROID_SHEET_HEADER_CENTER = 52

/** Top padding that puts a header row of `rowHeight` where its screen draws it: the board's 52pt centre inside an Android page sheet, under the real inset elsewhere. */
export const sheetHeaderTop = (os: string, inSheet: boolean, insetTop: number, rowHeight: number) =>
  os === 'android' && inSheet ? ANDROID_SHEET_HEADER_CENTER - rowHeight / 2 : insetTop
