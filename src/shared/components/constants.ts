export const SPINNER = { size: 12, box: 16, radius: 6, stroke: 2, trackOpacity: 0.25, turnMs: 1000 } as const
export const LOADING_LABEL = '불러오는 중'
export const TOAST_MS = { plain: 2500, action: 5000 } as const
// Android draws snackbars above native sheets: at the drawn 24 a lingering undo snackbar covers a confirm sheet's button and takes its tap.
export const TOAST_BOTTOM_GAP = { ios: 24, android: 64 } as const
export const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
export const PRESS_SCALE = 0.97
export const DISABLED_OPACITY = 0.4
