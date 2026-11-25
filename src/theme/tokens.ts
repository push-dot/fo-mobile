import { colors, largeText, shadows, typography } from '@push/design-system'
import { nativeShadow } from './native-shadow'

export { fontWeights, glow, photo, radius, spacing, tile, toast } from '@push/design-system'

export const palette = colors

export type Colors = { [K in keyof typeof palette.light]: string }

export type Weight = '400' | '500' | '600' | '700' | '800'

type NativeType = { fontSize: number; lineHeight: number; weight: Weight; letterSpacing: number }

export const type = Object.fromEntries(
  Object.entries(typography).map(([name, t]) => [
    name,
    { fontSize: t.fontSize, lineHeight: t.lineHeight, weight: String(t.fontWeight) as Weight, letterSpacing: t.fontSize * t.letterSpacing },
  ]),
) as Record<keyof typeof typography, NativeType>

export type TypeName = keyof typeof type

export const largeType = Object.fromEntries(
  Object.entries(largeText).map(([name, t]) => [
    name,
    { ...type[name as TypeName], fontSize: t.fontSize, lineHeight: t.lineHeight, letterSpacing: t.fontSize * typography[name as TypeName].letterSpacing },
  ]),
) as Record<keyof typeof largeText, NativeType>

const nativeShadows = <T extends Record<string, string>>(theme: T) =>
  Object.fromEntries(Object.entries(theme).map(([k, v]) => [k, nativeShadow(v)])) as { [K in keyof T]: ReturnType<typeof nativeShadow> }

export const shadow = { light: nativeShadows(shadows.light), dark: nativeShadows(shadows.dark) }

export const iosSystemFill = { light: 'rgba(118,118,128,.12)', dark: 'rgba(118,118,128,.24)' } as const

export const iosSheetButtonFill = 'rgba(120,120,128,.14)'

export const iosSheetFill = { light: '#F2F2F7', dark: '#1C1C1E' } as const

export const paperPage = { ring: 'rgba(0,0,0,0.06) 0px 0px 0px 1px', lifted: 'rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.12) 0px 4px 14px' } as const

export const iosSeparator = { light: 'rgba(118,118,128,0.06)', dark: palette.dark.line } as const

export const iosMaterial = { light: 'rgb(246,246,248)', dark: 'rgb(44,44,46)' } as const

export const counterPill = 'rgba(28,28,30,.72)'

export const cssShadow = {
  segment: '0 2px 8px rgba(0,0,0,.08)',
  approvalSheet: '0 -10px 40px rgba(0,0,0,.12)',
  iosPanel: '0 -4px 30px rgba(0,0,0,.12)',
  toast: '0 8px 24px rgba(0,0,0,.16)',
  banner: '0 10px 30px rgba(0,0,0,.14)',
  toneToast: '0 10px 30px rgba(0,0,0,.18)',
} as const
