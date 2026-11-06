const FLOAT_INSET = 8

/**
 * iOS 26 floats a partial sheet 8pt in from each screen edge on home-indicator phones and draws the window-wide content scaled
 * down to fit (on device a 100pt box drew 96pt at 402pt, 386/402). Returns the width to lay the content out at and the scale
 * that brings it back to design size; older iOS and home-button phones draw 1:1. With the keyboard up the sheet attaches and
 * draws 1:1 too (probed), so only the scale drops: a layout change while typing would dismiss the keyboard.
 */
export const floatingSheet = (windowWidth: number, iosVersion: string | number, homeInset: number, keyboardUp: boolean) =>
  parseInt(String(iosVersion), 10) >= 26 && homeInset > 0
    ? { width: windowWidth - 2 * FLOAT_INSET, scale: keyboardUp ? 1 : windowWidth / (windowWidth - 2 * FLOAT_INSET) }
    : null
