const ANDROID_SHEET_HEADER_CENTER = 52

export const sheetHeaderTop = (os: string, inSheet: boolean, insetTop: number, rowHeight: number) =>
  os === 'android' && inSheet ? ANDROID_SHEET_HEADER_CENTER - rowHeight / 2 : insetTop
