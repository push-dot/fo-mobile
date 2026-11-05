import type { Colors } from './tokens'

/** React Navigation colours taken from the design system. Same keys in light and dark. */
export const navigationColors = (
  colors: Pick<Colors, 'ac' | 'bg' | 'card' | 't1' | 'line' | 'red'>,
) => ({
  primary: colors.ac,
  background: colors.bg,
  card: colors.card,
  text: colors.t1,
  border: colors.line,
  notification: colors.red,
})
