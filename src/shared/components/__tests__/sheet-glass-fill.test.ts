import { describe, expect, it, vi } from 'vitest'
import { palette } from '@/theme/tokens'

vi.mock('expo-glass-effect', () => ({ GlassView: 'GlassView', isGlassEffectAPIAvailable: () => true }))
vi.mock('react-native', () => ({ Platform: { OS: 'ios' }, View: 'View', AccessibilityInfo: {} }))
vi.mock('../../../theme', () => ({}))
vi.mock('../../utility', () => ({}))

const { sheetGlassFill } = await import('../glass')

describe('glass inside a partial iOS sheet', () => {
  it('paints the board white in light and the glass token in dark', () => {
    expect(sheetGlassFill(true, false, palette.light)).toBe(palette.light.bg)
    expect(sheetGlassFill(true, true, palette.dark)).toBe(palette.dark.glass)
  })

  it('leaves glass outside a sheet to the native surface', () => {
    expect(sheetGlassFill(false, false, palette.light)).toBeNull()
  })
})
