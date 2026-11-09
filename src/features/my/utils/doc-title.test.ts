import { describe, expect, it } from 'vitest'
import { clipTitle, DOC_TITLE_MAX, renamedTitle, titleLength } from './doc-title'

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
})
