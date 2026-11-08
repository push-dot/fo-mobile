import { describe, expect, it } from 'vitest'
import { sheetHeaderTop } from './sheet-header'

const INSET = 52
const TOP_BAR_ROW = 56
const BUTTON_ROW = 44

describe('sheet header top', () => {
  it('centres an Android page sheet header at 52pt whatever the real inset is', () => {
    expect(sheetHeaderTop('android', true, INSET, TOP_BAR_ROW) + TOP_BAR_ROW / 2).toBe(52)
    expect(sheetHeaderTop('android', true, 24, TOP_BAR_ROW)).toBe(24)
    expect(sheetHeaderTop('android', true, INSET, BUTTON_ROW) + BUTTON_ROW / 2).toBe(52)
  })

  it('leaves iOS on the real inset', () => {
    expect(sheetHeaderTop('ios', true, 59, TOP_BAR_ROW)).toBe(59)
  })

  it('leaves a route outside a page sheet on the real inset', () => {
    expect(sheetHeaderTop('android', false, INSET, TOP_BAR_ROW)).toBe(INSET)
  })
})
