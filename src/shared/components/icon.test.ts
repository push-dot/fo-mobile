import { describe, expect, it, vi } from 'vitest'

const parse = vi.hoisted(() => vi.fn((xml: string) => ({ tag: 'svg', xml })))

vi.mock('react-native-svg', () => ({ parse, SvgAst: 'SvgAst' }))
vi.mock('@push/design-system', () => ({ LINE_ICONS: {} }))
vi.mock('../../theme', () => ({ useColors: () => ({}) }))

describe('astOf', () => {
  it('parses each svg string once and returns the same tree', async () => {
    const { astOf } = await import('./icon')
    const xml = '<svg viewBox="0 0 24 24"></svg>'
    const first = astOf(xml)
    expect(astOf(xml)).toBe(first)
    expect(parse).toHaveBeenCalledTimes(1)
  })
})
