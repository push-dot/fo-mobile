import { describe, expect, it } from 'vitest'
import { sheetHeaderTop } from '@/shared/navigation/sheet-header'
import { fromSheetParam, SHEET_PARAM } from './sheet-param'

const INSET = 52
const TOP_BAR_ROW = 56

describe('Push 서류 sheet param', () => {
  it('moves the pushed Push 서류 page only when the modal opened it, not from the tabs', () => {
    expect(sheetHeaderTop('android', fromSheetParam(SHEET_PARAM), INSET, TOP_BAR_ROW)).toBe(24)
    expect(sheetHeaderTop('android', fromSheetParam(undefined), INSET, TOP_BAR_ROW)).toBe(INSET)
  })
})
