import { spacing } from '@push/design-system'

const FLOAT_INSET = 8

/**
 * iOS 26 floats a partial sheet 8pt in from each screen edge on home-indicator phones and draws the window-wide content scaled
 * down to fit (on device a 100pt box drew 96pt at 402pt, 386/402). Returns the width to lay the content out at, the scale
 * that brings it back to design size, and the bottom margin for content of a given height: UIKit sizes the sheet from the
 * unscaled height plus the home inset, so the margin trims it to the drawn content plus the artboard's 20pt. Older iOS and
 * home-button phones draw 1:1. With the keyboard up the sheet attaches and draws 1:1 (probed); the width stays, since a width
 * change while typing dismissed the keyboard.
 */
export const floatingSheet = (windowWidth: number, iosVersion: string | number, homeInset: number, keyboardUp: boolean) => {
  if (!(parseInt(String(iosVersion), 10) >= 26 && homeInset > 0)) return null
  const width = windowWidth - 2 * FLOAT_INSET
  const scale = keyboardUp ? 1 : windowWidth / width
  return { width, scale, marginBottom: (height: number) => (scale - 1) * height + spacing[5] * scale - homeInset }
}
