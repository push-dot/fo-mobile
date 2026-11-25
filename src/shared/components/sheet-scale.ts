import { spacing } from '@push/design-system'

const FLOAT_INSET = 8

export const floatingSheet = (windowWidth: number, iosVersion: string | number, homeInset: number, keyboardUp: boolean) => {
  if (!(parseInt(String(iosVersion), 10) >= 26 && homeInset > 0)) return null
  const width = windowWidth - 2 * FLOAT_INSET
  const scale = keyboardUp ? 1 : windowWidth / width
  return { width, scale, marginBottom: (height: number) => (scale - 1) * height + spacing[5] * scale - homeInset }
}
