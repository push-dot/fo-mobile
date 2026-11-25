import { NATIVE_FONTS } from '../../theme/fonts'
import { radius, type Colors } from '../../theme/tokens'

export const A2UI_THEME_COLORS = [
  'bg', 'bg2', 'card', 'fill', 'fill2', 'line', 't1', 't2', 't3', 'ac', 'acSoft', 'acText',
  'green', 'greenSoft', 'red', 'redSoft', 'orange', 'orangeSoft', 'onFill',
] as const satisfies readonly (keyof Colors)[]

export const a2uiThemeJson = (c: Colors, os: 'ios' | 'android') => {
  if (process.env.NODE_ENV !== 'production') {
    const missing = A2UI_THEME_COLORS.filter((k) => !c[k])
    if (missing.length) throw new Error(`A2UI theme is missing colour tokens: ${missing.join(', ')}`)
  }
  return JSON.stringify({
    colors: Object.fromEntries(A2UI_THEME_COLORS.map((k) => [k, c[k]])),
    fonts: NATIVE_FONTS,
    radius: {
      xs: radius.xs,
      sm: radius.sm,
      md: radius.md,
      lg: radius.lg,
      pill: radius.pill,
      surface: os === 'ios' ? radius.lg : radius.sm,
    },
  })
}
