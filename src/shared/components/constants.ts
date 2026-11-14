export const SPINNER = { size: 12, box: 16, radius: 6, stroke: 2, trackOpacity: 0.25, turnMs: 1000 } as const
export const LOADING_LABEL = '불러오는 중'
export const TOAST_MS = { plain: 2500, action: 5000 } as const
export const TOAST_BOTTOM_GAP = 24
export const TOAST_SHEET_GAP = 29
export const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
/** The sheet grabber the boards draw: `.grab` 36x5 on iOS, `.and .sheet2 .grab` 32x4 on Android. */
export const GRABBER = { ios: { width: 36, height: 5, borderRadius: 3 }, android: { width: 32, height: 4, borderRadius: 2 } } as const
export const PRESS_SCALE = 0.97
export const DISABLED_OPACITY = 0.4
export const SHEET_ACTION_GAP = { filter: 6, quickStart: 4 } as const
/** iOS filter sheets (.ifoot): the CTA sits 20 under the last chips. */
export const IOS_FILTER_ACTION_GAP = 20
