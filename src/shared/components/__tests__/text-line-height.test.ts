import { describe, expect, it, vi } from 'vitest'
import { type } from '@/theme/tokens'

const flatten = (s: unknown): Record<string, unknown> => (Array.isArray(s) ? Object.assign({}, ...s.map(flatten)) : ((s ?? {}) as Record<string, unknown>))
vi.mock('react-native', () => ({ Platform: { OS: 'ios' }, Text: 'RNText', StyleSheet: { flatten } }))
vi.mock('../../../theme', async () => ({ ...(await import('@/theme/tokens')), fontFor: () => ({}), useColors: () => ({ t1: '#000' }) }))

const { default: Text } = await import('../text')
const lineHeight = (props: Parameters<typeof Text>[0]) => flatten(Text(props)!.props.style).lineHeight

describe('Text line height on iOS', () => {
  it('keeps the token line height a hair under the pixel grid', () => {
    expect(lineHeight({ v: 'b1' })).toBeCloseTo(type.b1.lineHeight - 0.01)
  })

  it('applies the same hair to a line height a caller sets through style', () => {
    expect(lineHeight({ v: 'b1', style: { lineHeight: 22 } })).toBeCloseTo(21.99)
    expect(lineHeight({ v: 'c1', style: [{ fontSize: 14 }, { lineHeight: 20 }] })).toBeCloseTo(19.99)
  })
})
