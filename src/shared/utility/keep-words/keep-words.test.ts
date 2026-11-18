import { describe, expect, it } from 'vitest'
import { keepPartsWhole, keepWordsWhole, WORD_JOINER as WJ } from './keep-words'

describe('keepWordsWhole', () => {
  it('forbids a break at a middle dot inside a word and around its brackets', () => {
    expect(keepWordsWhole('엔지니어(결제·정산 플랫폼) 채용')).toBe(`엔지니어${WJ}(결제${WJ}·${WJ}정산 플랫폼) 채용`)
    expect(keepWordsWhole('(Kotlin·Spring)을')).toBe(`(Kotlin${WJ}·${WJ}Spring)${WJ}을`)
  })

  it('keeps a Latin word, its hyphens and the Hangul particle after it in one piece (ChatPh1: payment-retry-lab을)', () => {
    expect(keepWordsWhole('payment-retry-lab을 찾았어요')).toBe(`payment${WJ}-${WJ}retry${WJ}-${WJ}lab${WJ}을 찾았어요`)
    expect(keepWordsWhole('8.1로 올렸어요')).toBe(`8.1${WJ}로 올렸어요`)
    expect(keepWordsWhole('이력서PDF')).toBe(`이력서${WJ}PDF`)
  })

  it('leaves spaced dots, spaced hyphens, plain words and an already joined word alone', () => {
    expect(keepWordsWhole('개발 · 4년차')).toBe(`개발 · 4${WJ}년차`)
    expect(keepWordsWhole('안녕하세요. 반가워요')).toBe('안녕하세요. 반가워요')
    expect(keepWordsWhole('GitHub 살펴보기 - 완료')).toBe('GitHub 살펴보기 - 완료')
    for (const s of ['결제·정산', 'payment-retry-lab을', '(Kotlin·Spring)을']) expect(keepWordsWhole(keepWordsWhole(s))).toBe(keepWordsWhole(s))
  })
})

describe('keepPartsWhole', () => {
  it('puts the joiner of a seam between nested parts at the start of the next part', () => {
    expect(keepPartsWhole(['이력서에 없는 저장소 ', 'payment-retry-lab', '을 찾았어요.'])).toEqual([
      '이력서에 없는 저장소 ',
      `payment${WJ}-${WJ}retry${WJ}-${WJ}lab`,
      `${WJ}을 찾았어요.`,
    ])
  })

  it('keeps the characters of every part, joiners aside', () => {
    const parts = ['결제·', '정산 Kotlin', '을 ', 'a-b']
    expect(keepPartsWhole(parts).map((p) => p.replaceAll(WJ, ''))).toEqual(parts)
  })
})
