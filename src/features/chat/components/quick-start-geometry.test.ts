import { SLIM_HEIGHT } from '@/shared/components/segmented-control.compact'
import { describe, expect, it } from 'vitest'
import { ALL_DESCRIPTION_TOP, ALL_FIELD_HEIGHT, COMPOSE, QUICK_STARTS } from '../constants'

describe('quick-start sheets keep the heights their boards draw', () => {
  it('draws the sheet tabs 40 high, not the 44 of the page tabs', () => {
    expect(SLIM_HEIGHT).toBe(40)
  })

  it('draws the QsExp free-input field 54 high and leaves QsPost on the default', () => {
    expect(QUICK_STARTS.find((q) => q.key === 'exp')?.customHeight).toBe(54)
    expect(QUICK_STARTS.find((q) => q.key === 'post')?.customHeight).toBeUndefined()
  })

  it('lays the all-topics page out as .compose', () => {
    expect(COMPOSE).toEqual({ top: 16, header: 44, side: 20, bottom: 8 })
    expect(ALL_DESCRIPTION_TOP).toBe(6)
    expect(ALL_FIELD_HEIGHT).toBe(52)
  })
})
