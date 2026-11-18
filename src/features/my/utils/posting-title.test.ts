import { describe, expect, it } from 'vitest'
import { postingTitleLines } from './posting-title'

describe('postingTitleLines', () => {
  it('puts a trailing parenthetical on its own line', () => {
    expect(postingTitleLines('백엔드 엔지니어 (Kotlin·Spring)')).toEqual(['백엔드 엔지니어', '(Kotlin·Spring)'])
  })

  it('keeps a title without a parenthetical on one line', () => {
    expect(postingTitleLines('프론트엔드 개발자')).toEqual(['프론트엔드 개발자'])
  })

  it('keeps a leading parenthetical attached', () => {
    expect(postingTitleLines('(주)모아페이 개발자')).toEqual(['(주)모아페이 개발자'])
  })
})
