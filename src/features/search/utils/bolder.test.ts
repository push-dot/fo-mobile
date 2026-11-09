import { describe, expect, it } from 'vitest'
import { bolder } from './bolder'

describe('bolder', () => {
  it('draws the match like the boards’ <b>: one face bolder than the line, 800 at most', () => {
    expect(['400', '500', '600', '700', '800'].map((w) => bolder(w as '400'))).toEqual(['700', '700', '800', '800', '800'])
  })
})
