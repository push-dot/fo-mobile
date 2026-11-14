import { describe, expect, it, vi } from 'vitest'
import { type } from '@/theme/tokens'

const flatten = (s: unknown): Record<string, unknown> => (Array.isArray(s) ? Object.assign({}, ...s.map(flatten)) : ((s ?? {}) as Record<string, unknown>))
vi.mock('react-native', () => ({ Platform: { OS: 'ios' }, Text: 'RNText', StyleSheet: { flatten } }))
vi.mock('../../../theme', async () => ({ ...(await import('@/theme/tokens')), fontFor: () => ({}), useColors: () => ({ t1: '#000' }) }))

const { default: Text, boardTracking, keepWordsWhole, joinWords } = await import('../text')
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

describe('Text tracking', () => {
  const tracking = (props: Parameters<typeof Text>[0]) => flatten(Text(props)!.props.style).letterSpacing as number

  it('keeps the token tracking plus the board correction at the token size', () => {
    expect(tracking({ v: 'b2' })).toBeCloseTo(type.b2.letterSpacing + boardTracking(type.b2.fontSize))
  })

  it('computes tracking from the size a style sets, with no correction from 16px', () => {
    expect(tracking({ v: 'b2', style: { fontSize: 22 } })).toBeCloseTo(22 * -0.02)
    expect(tracking({ v: 'b2', style: { fontSize: 16 } })).toBeCloseTo(16 * -0.02)
  })

  it('leaves a tracking the caller sets alone', () => {
    expect(tracking({ v: 'b2', style: { fontSize: 22, letterSpacing: 1 } })).toBe(1)
  })
})

describe('board tracking (device WebKit lays 12-15px narrower than CoreText)', () => {
  it('removes 0.0015em per glyph for each px under 16', () => {
    expect(boardTracking(16)).toBe(0)
    expect(boardTracking(17)).toBe(0)
    expect(boardTracking(15)).toBeCloseTo(-0.0225)
    expect(boardTracking(12)).toBeCloseTo(-0.0015 * 4 * 12)
  })

  // MyProfile.1 intro line 1: CoreText 362.37 at -0.02em, 30 glyphs; the board box is 361.7 in a 362 column.
  it('takes the profile intro line under the 362 pt column', () => {
    expect(362.37 + boardTracking(15) * 30).toBeLessThan(361.7 + 0.1)
  })
})

describe('words the boards keep whole', () => {
  const WJ = '\u2060'

  it('forbids a break at a middle dot inside a word and around its brackets', () => {
    expect(keepWordsWhole('엔지니어(결제·정산 플랫폼) 채용')).toBe(`엔지니어${WJ}(결제${WJ}·${WJ}정산 플랫폼) 채용`)
    expect(keepWordsWhole('(Kotlin·Spring)을')).toBe(`(Kotlin${WJ}·${WJ}Spring)${WJ}을`)
  })

  it('leaves spaced dots, plain words and an already joined word alone', () => {
    expect(keepWordsWhole('개발 · 4년차')).toBe('개발 · 4년차')
    expect(keepWordsWhole('안녕하세요. 반가워요')).toBe('안녕하세요. 반가워요')
    expect(keepWordsWhole(keepWordsWhole('결제·정산'))).toBe(keepWordsWhole('결제·정산'))
  })

  it('reads the original through the label, and keeps nested text and a caller label as written', () => {
    expect(joinWords('결제·정산')).toEqual({ children: [`결제${WJ}·${WJ}정산`], label: '결제·정산' })
    expect(joinWords('결제 정산')).toEqual({ children: '결제 정산' })
    const nested = ['a', { type: 'x' }] as never
    expect(joinWords(nested).children).toBe(nested)
    expect(Text({ children: '결제·정산', accessibilityLabel: '메모' })!.props.accessibilityLabel).toBe('메모')
    expect(Text({ children: '결제·정산' })!.props.accessibilityLabel).toBe('결제·정산')
  })
})

describe('Text Korean line breaks', () => {
  it('keeps words whole on iOS (rule 5), and lets a caller override', () => {
    expect(Text({})!.props.lineBreakStrategyIOS).toBe('hangul-word')
    expect(Text({ lineBreakStrategyIOS: 'none' })!.props.lineBreakStrategyIOS).toBe('none')
  })
})
