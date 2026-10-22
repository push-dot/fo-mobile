import { describe, expect, it } from 'vitest'
import { matchHangul, searchHangul } from './hangul-search'

describe('matchHangul', () => {
  it('matches choseong', () => {
    expect(matchHangul('모아페이', 'ㅁㅇㅍㅇ')).toMatchObject({ kind: 'choseong', start: 0, end: 4 })
    expect(matchHangul('결제 백엔드 엔지니어', 'ㅂㅇㄷ')).toMatchObject({ kind: 'choseong', start: 3, end: 6 })
  })
  it('matches a syllable still being typed', () => {
    expect(matchHangul('백엔드 엔지니어', '백ㅇ')).toMatchObject({ kind: 'jamo', start: 0, end: 2 })
    expect(matchHangul('모아페이', '모앞')).toMatchObject({ kind: 'jamo', start: 0, end: 3 })
  })
  it('matches qwerty typed with the wrong input mode', () => {
    expect(matchHangul('모아페이', 'ahdkvpdl')).toMatchObject({ kind: 'qwerty' })
  })
  it('prefers exact and prefix over contains', () => {
    expect(matchHangul('결제', '결제')?.kind).toBe('exact')
    expect(matchHangul('결제 승인 API', '결제')?.kind).toBe('prefix')
    expect(matchHangul('카드 결제', '결제')).toMatchObject({ kind: 'contains', start: 3, end: 5 })
    expect(matchHangul('Kotlin', 'kot')?.kind).toBe('prefix')
  })
  it('returns null on no match', () => {
    expect(matchHangul('모아페이', 'ㅋㅋ')).toBeNull()
  })
})

describe('searchHangul', () => {
  it('ranks results and drops non-matches', () => {
    const items = ['카드 결제', '결제', '모아페이', '결제 승인']
    const out = searchHangul(items, '결제', (s) => [s]).map((r) => r.item)
    expect(out).toEqual(['결제', '결제 승인', '카드 결제'])
  })
})
