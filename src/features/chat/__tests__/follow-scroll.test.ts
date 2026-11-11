import { describe, expect, it } from 'vitest'
import { followScroll } from '../utils/follow-scroll'

describe('followScroll', () => {
  it('asks for fresh content when not at bottom', () => {
    expect(followScroll(false, false, false)).toBe('fresh')
    expect(followScroll(false, true, false)).toBe('fresh')
  })

  it('scrolls instantly when working at bottom', () => {
    expect(followScroll(true, true, false)).toBe('instant')
  })

  it('scrolls instantly when reduce motion at bottom', () => {
    expect(followScroll(true, false, true)).toBe('instant')
  })

  it('scrolls animated when idle at bottom without reduce motion', () => {
    expect(followScroll(true, false, false)).toBe('animated')
  })
})
