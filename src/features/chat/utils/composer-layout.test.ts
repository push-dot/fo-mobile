import { describe, expect, it } from 'vitest'
import { COMPOSER_ROW, settleComposerLayout } from './composer-layout'

const type = (steps: [lines: number, length: number][]) => steps.reduce((layout, [lines, length]) => settleComposerLayout(layout, lines, length), COMPOSER_ROW)

describe('composer layout', () => {
  it('stays one pill while the text fits on one line', () => {
    expect(type([[1, 4], [1, 12]]).box).toBe(false)
  })

  it('becomes a box when the text wraps', () => {
    expect(type([[1, 12], [2, 13]]).box).toBe(true)
  })

  it('stays a box when the wider field fits the same text on one line', () => {
    expect(type([[2, 13], [1, 13], [1, 14]]).box).toBe(true)
  })

  it('goes back to the pill once the text is shorter than what made it wrap and fits one line', () => {
    expect(type([[2, 13], [1, 12]]).box).toBe(false)
  })

  it('stays a box while the shorter text still wraps', () => {
    expect(type([[3, 40], [2, 30]]).box).toBe(true)
  })

  it('goes back to the pill when the field is emptied, even if it never measured one line', () => {
    expect(type([[5, 80], [5, 0]]).box).toBe(false)
  })

  it('keeps the same object when nothing changes', () => {
    const box = type([[2, 13]])
    expect(settleComposerLayout(box, 2, 20)).toBe(box)
    expect(settleComposerLayout(COMPOSER_ROW, 1, 3)).toBe(COMPOSER_ROW)
  })
})
