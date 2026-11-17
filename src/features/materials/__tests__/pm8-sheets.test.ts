import { describe, expect, it } from 'vitest'
import { PM8_MDET_HEAD, PM8_MDET_TITLE, PM8_SLIM_ACTION } from '@/shared/components/pm8'

describe('materials sheets on the .pm8 boards (the Bot pick is a regular sheet over the 자료 modal, RULINGS 53)', () => {
  it('draws the material title 22/30 bold on a 52 high head and the buttons 52 high with a 26 radius', () => {
    expect(PM8_MDET_TITLE).toEqual({ fontSize: 22, lineHeight: 30, weight: '700' })
    expect(PM8_MDET_HEAD).toEqual({ minHeight: 52, paddingTop: 4, paddingBottom: 8 })
    expect(PM8_SLIM_ACTION).toEqual({ minHeight: 52, borderRadius: 26 })
  })
})
