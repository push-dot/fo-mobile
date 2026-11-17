import { describe, expect, it } from 'vitest'
import { spacing } from '@push/design-system'
import { iosSheetButtonFill } from '@/theme/tokens'
import { GRABBER } from '@/shared/components/constants'
import { PM8, pm8Row, pm8SecondaryFill } from './choice-sheet-layout'

describe('pm8 choice sheet layout', () => {
  it('puts the title 17 under the sheet top like .isheet.pm8 (8 + the 5 grabber + 4)', () => {
    expect(spacing[3] + GRABBER.ios.height + PM8.topGap).toBe(17)
  })

  it('puts the first button 14 under the title like .pm-f', () => {
    expect(PM8.gap + PM8.buttonsTop).toBe(14)
    expect(PM8.gap + PM8.actionGap).toBe(14)
  })

  it('leaves 38 under the last button (26 of a slim sheet plus 12) like .isheet.pm8', () => {
    expect(26 + PM8.bottomExtra).toBe(38)
  })

  it('tints the secondary button with systemFill on iOS light only', () => {
    expect(pm8SecondaryFill(true, false)).toBe(iosSheetButtonFill)
    expect(pm8SecondaryFill(true, true)).toBeUndefined()
    expect(pm8SecondaryFill(false, false)).toBeUndefined()
  })

  it('draws a marked option row 52 high with a 14 gap and a plain row 50 with 12', () => {
    expect(pm8Row(true)).toEqual({ minHeight: 52, gap: 14 })
    expect(pm8Row(false)).toEqual({ minHeight: 50, gap: 12 })
  })
})
