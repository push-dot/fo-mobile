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

/** The boards' `--iFill` (iOS system fill): translucent, so a field greys whatever sheet it sits on (FilterSkill's `.isearch`, #E3E3E9 on the board). */
export const iosSystemFill = { light: 'rgba(118,118,128,.12)', dark: 'rgba(118,118,128,.24)' } as const

/** The boards' `--iMat`: the iOS banner material (.ibanner), 96% opaque, so the card reads grey (#F6F6F8) on a white screen. */
export const iosMaterial = { light: 'rgba(246,246,248,.96)', dark: 'rgba(44,44,46,.96)' } as const

/** CSS shadows the boards draw inline on one component, outside the design system's set. */
export const cssShadow = {
  segment: '0 2px 8px rgba(0,0,0,.08)',
  approvalSheet: '0 -10px 40px rgba(0,0,0,.12)',
  /** `.ios .panel` (ChatApprove): the confirm panel's lift; the 1px ring is added in place. */
  iosPanel: '0 -4px 30px rgba(0,0,0,.12)',
  toast: '0 8px 24px rgba(0,0,0,.16)',
  /** .ibanner: the iOS toast. */
  banner: '0 10px 30px rgba(0,0,0,.14)',
  toneToast: '0 10px 30px rgba(0,0,0,.18)',
} as const
