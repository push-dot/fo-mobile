import { describe, expect, it } from 'vitest'
import { clipTitle, DOC_TITLE_MAX, renamedTitle, savedLength, titleLength, titleOver, typedTitle } from './doc-title'

describe('doc title', () => {
  it('counts code points, so an emoji is one', () => {
    expect(titleLength('이력서😀')).toBe(4)
    expect('😀'.length).toBe(2)
  })

  it('clips to 40 code points without splitting a surrogate pair', () => {
    const clipped = clipTitle('😀'.repeat(41))
    expect(titleLength(clipped)).toBe(DOC_TITLE_MAX)
    expect(clipped).toBe('😀'.repeat(40))
  })

  it('saves only a changed, non-empty name', () => {
    expect(renamedTitle('모아페이 이력서', '  모아페이 이력서  ')).toBeNull()
    expect(renamedTitle('모아페이 이력서', '   ')).toBeNull()
    expect(renamedTitle('모아페이 이력서', ' 하루랩스 지원본 ')).toBe('하루랩스 지원본')
  })

  it('keeps a name past the cap whole and only lets it shrink', () => {
    const long = '가'.repeat(57)
    expect(typedTitle(long, long.slice(0, 56))).toBe(long.slice(0, 56))
    expect(typedTitle(long, long + '나')).toBe(long)
    expect(titleOver(long)).toBe(true)
    expect(titleOver('가'.repeat(40))).toBe(false)
  })

  it('counts and caps the same trimmed name', () => {
    const padded = ` ${'가'.repeat(40)} `
    expect(savedLength(padded)).toBe(40)
    expect(titleOver(padded)).toBe(false)
    expect(savedLength(` ${'가'.repeat(41)}`)).toBe(41)
    expect(titleOver(` ${'가'.repeat(41)}`)).toBe(true)
  })

  it('stops typing at the cap for a name under it', () => {
    expect(typedTitle('이력서', '가'.repeat(45))).toBe('가'.repeat(40))
  })
})
