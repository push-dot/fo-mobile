import { onAccent } from './on-accent'
import type { Colors } from './tokens'

/** The 11 swatches of 봇 만들기 and 색 바꾸기, in board order. */
export const MASCOT_COLORS = ['teal', 'sky', 'blue', 'violet', 'pink', 'red', 'coral', 'amber', 'green', 'brown', 'gray'] as const

export type MascotColorName = (typeof MASCOT_COLORS)[number]

/** 'push' is the Push Bot, whose body follows the theme. */
export type MascotColor = MascotColorName | 'push'

export type MascotPalette = { body: string; foldDark: string; foldLight: string }

export const MASCOT_PALETTES: Record<MascotColorName, MascotPalette> = {
  teal: { body: '#2BB5A0', foldDark: '#1B7063', foldLight: '#95DAD0' },
  sky: { body: '#5BC0EB', foldDark: '#387792', foldLight: '#ADE0F5' },
  blue: { body: '#3B82F6', foldDark: '#255199', foldLight: '#9DC0FA' },
  violet: { body: '#8B6FE8', foldDark: '#564590', foldLight: '#C5B7F4' },
  pink: { body: '#F06595', foldDark: '#953F5C', foldLight: '#F8B2CA' },
  red: { body: '#E5484D', foldDark: '#8E2D30', foldLight: '#F2A4A6' },
  coral: { body: '#F2704E', foldDark: '#964530', foldLight: '#F8B8A6' },
  amber: { body: '#E0A040', foldDark: '#8B6328', foldLight: '#F0D0A0' },
  green: { body: '#7FB069', foldDark: '#4F6D41', foldLight: '#BFD8B4' },
  brown: { body: '#8A6A4E', foldDark: '#564230', foldLight: '#C4B4A6' },
  gray: { body: '#7A818B', foldDark: '#4C5056', foldLight: '#BCC0C5' },
}

const PUSH_BOT_PALETTE: Record<'light' | 'dark', MascotPalette> = {
  light: { body: '#16191D', foldDark: '#D9DDE2', foldLight: '#4B525C' },
  dark: { body: '#FFFFFF', foldDark: '#33373E', foldLight: '#C2C7CE' },
}

// The boards draw the eyes and tie in this purple on every body and in both schemes, so it is not the `ac` token.
export const MASCOT_FACE = { eye: '#5B4CF0', pupil: '#FFFFFF', mouth: '#5B4CF0' } as const

export const mascotPalette = (color: MascotColor, mode: 'light' | 'dark'): MascotPalette =>
  color === 'push' ? PUSH_BOT_PALETTE[mode] : MASCOT_PALETTES[color]

/** The status marks take the tokens the boards name: --t3, --orange, --green, --ac, and --bg for the ring. */
export const mascotAccent = (c: Pick<Colors, 't3' | 'orange' | 'green' | 'ac' | 'bg'>) => ({
  thinkDot: c.t3,
  helpBadge: c.orange,
  helpMark: onAccent,
  doneSpark: c.green,
  unread: c.ac,
  ring: c.bg,
})
