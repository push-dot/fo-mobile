import { NATIVE_FONTS } from '../../theme/fonts'
import { radius, type Colors } from '../../theme/tokens'

/** The colour tokens sent to the Push components; a2ui-theme.test.ts checks they cover every one the native code reads. */
export const A2UI_THEME_COLORS = [
  'bg', 'bg2', 'card', 'fill', 'fill2', 'line', 't1', 't2', 't3', 'ac', 'acSoft', 'acText',
  'green', 'greenSoft', 'red', 'redSoft', 'orange', 'orangeSoft', 'onFill',
] as const satisfies readonly (keyof Colors)[]

/**
 * The tokens a surface draws with. The server sends no theme: the app's colours for the current scheme, Noto Sans KR, its
 * radii. A token missing from the scheme fails here in development instead of drawing in the native fallback.
 */
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
      // The surface itself: iOS a grouped card (radius-lg), Android a Material card (12).
      surface: os === 'ios' ? radius.lg : radius.sm,
    },
  })
}
