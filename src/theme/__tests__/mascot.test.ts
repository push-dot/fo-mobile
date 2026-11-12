import { describe, expect, it } from 'vitest'
import { MASCOT_COLORS, mascotAccent, mascotPalette } from '../mascot'
import { onAccent } from '../on-accent'
import { palette } from '../tokens'

// Body, dark fold, light fold, as drawn in the 2026-11-12 boards.
const BOARD = {
  teal: ['#2BB5A0', '#1B7063', '#95DAD0'],
  sky: ['#5BC0EB', '#387792', '#ADE0F5'],
  blue: ['#3B82F6', '#255199', '#9DC0FA'],
  violet: ['#8B6FE8', '#564590', '#C5B7F4'],
  pink: ['#F06595', '#953F5C', '#F8B2CA'],
  red: ['#E5484D', '#8E2D30', '#F2A4A6'],
  coral: ['#F2704E', '#964530', '#F8B8A6'],
  amber: ['#E0A040', '#8B6328', '#F0D0A0'],
  green: ['#7FB069', '#4F6D41', '#BFD8B4'],
  brown: ['#8A6A4E', '#564230', '#C4B4A6'],
  gray: ['#7A818B', '#4C5056', '#BCC0C5'],
} as const

describe('mascot palette', () => {
  it('offers the 11 swatches in board order', () => {
    expect(MASCOT_COLORS).toEqual(Object.keys(BOARD))
  })

  it.each(MASCOT_COLORS)('%s is drawn in the board colours in both schemes', (name) => {
    const [body, foldDark, foldLight] = BOARD[name]
    expect(mascotPalette(name, 'light')).toEqual({ body, foldDark, foldLight })
    expect(mascotPalette(name, 'dark')).toEqual({ body, foldDark, foldLight })
  })

  it('the Push Bot is black on light and white on dark', () => {
    expect(mascotPalette('push', 'light')).toEqual({ body: '#16191D', foldDark: '#D9DDE2', foldLight: '#4B525C' })
    expect(mascotPalette('push', 'dark')).toEqual({ body: '#FFFFFF', foldDark: '#33373E', foldLight: '#C2C7CE' })
  })
})

describe('mascot accents', () => {
  it('come from the theme tokens it is given', () => {
    expect(mascotAccent({ t3: 't3', orange: 'orange', green: 'green', ac: 'ac', bg: 'bg' })).toEqual({
      thinkDot: 't3',
      helpBadge: 'orange',
      helpMark: onAccent,
      doneSpark: 'green',
      unread: 'ac',
      ring: 'bg',
    })
  })

  it.each([
    ['light', { thinkDot: '#646B75', helpBadge: '#AD4E00', helpMark: '#FFFFFF', doneSpark: '#087A3E', unread: '#5B4CF0', ring: '#FFFFFF' }],
    ['dark', { thinkDot: '#8C939C', helpBadge: '#FF9A3D', helpMark: '#FFFFFF', doneSpark: '#3CCB7F', unread: '#6B5BFA', ring: '#0F1012' }],
  ] as const)('are the colours the %s boards draw', (mode, board) => {
    expect(mascotAccent(palette[mode])).toEqual(board)
  })
})
