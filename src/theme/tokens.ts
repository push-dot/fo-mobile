import { colors, shadows, typography } from '@push/design-system'
import { nativeShadow } from './native-shadow'

export { radius } from '@push/design-system'

export const palette = colors

export type Colors = { [K in keyof typeof palette.light]: string }

export type Weight = '400' | '500' | '600' | '700' | '800'

type NativeType = { fontSize: number; lineHeight: number; fontWeight: Weight; letterSpacing: number }

export const type = Object.fromEntries(
  Object.entries(typography).map(([name, t]) => [
    name,
    { fontSize: t.fontSize, lineHeight: t.lineHeight, fontWeight: String(t.fontWeight), letterSpacing: t.fontSize * t.letterSpacing },
  ]),
) as Record<keyof typeof typography, NativeType>

export type TypeName = keyof typeof type

const nativeShadows = (theme: { pop: string; glass: string }) => ({
  pop: nativeShadow(theme.pop),
  glass: nativeShadow(theme.glass),
})

export const shadow = { light: nativeShadows(shadows.light), dark: nativeShadows(shadows.dark) }
