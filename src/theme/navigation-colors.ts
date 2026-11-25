import type { Colors } from './tokens'

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
