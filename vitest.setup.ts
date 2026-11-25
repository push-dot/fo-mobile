import { vi } from 'vitest'

vi.mock('react-native-unistyles', async () => {
  const { palette, radius, shadow, spacing, type } = await import('./src/theme/tokens')
  const { platformTokens } = await import('./src/theme/platform')
  const theme = { mode: 'light', colors: palette.light, shadow: shadow.light, spacing, radius, type, platform: platformTokens('ios') }
  const rt = { insets: { top: 0, bottom: 0, left: 0, right: 0, ime: 0 }, fontScale: 1, pixelRatio: 1, screen: { width: 0, height: 0 }, themeName: 'light' }
  const create = (styles: unknown) => (typeof styles === 'function' ? styles(theme, rt) : styles)
  const flatten = (style: unknown): Record<string, unknown> =>
    Array.isArray(style) ? Object.assign({}, ...style.map(flatten)) : ((style as Record<string, unknown>) ?? {})
  return {
    StyleSheet: { create, configure: () => {}, flatten, absoluteFillObject: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, hairlineWidth: 1 },
    UnistylesRuntime: { setTheme: () => {}, setAdaptiveThemes: () => {}, insets: rt.insets, themeName: 'light' },
    useUnistyles: () => ({ theme, rt }),
    withUnistyles: (component: unknown) => component,
  }
})
