import { describe, expect, it } from 'vitest'
import { clampLines } from './word-clamp'

describe('clampLines', () => {
  it('keeps the first lines whole when the text needs more', () => {
    expect(clampLines(['누리클라우드 ', '플랫폼엔지니어링코리아 ', '판교캠퍼스 유한회사'], 2)).toEqual(['누리클라우드 ', '플랫폼엔지니어링코리아 '])
  })

  it('returns null when every line fits', () => {
    expect(clampLines(['누리클라우드 ', '플랫폼엔지니어링코리아'], 2)).toBeNull()
    expect(clampLines(['한 줄'], 2)).toBeNull()
  })

  it('drops the word joiners the text component adds and a trailing line break', () => {
    expect(clampLines(['모아페이⁠·⁠백엔드\n', '둘째 줄 ', '셋째'], 2)).toEqual(['모아페이·백엔드', '둘째 줄 '])
  })

  it('cuts a single line the same way', () => {
    expect(clampLines(['누리클라우드 플랫폼엔지니어링코리아 ', '판교캠퍼스 유한회사 · 플랫폼 엔지니어'], 1)).toEqual(['누리클라우드 플랫폼엔지니어링코리아 '])
  })
})
