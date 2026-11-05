import { describe, expect, it } from 'vitest'
import { palette } from './tokens'
import { selectedRing } from './selected-ring'

describe('selected ring', () => {
  it('selected ring style', () => {
    expect(selectedRing(palette.light)).toEqual({
      backgroundColor: palette.light.acSoft,
      borderWidth: 1.5,
      borderColor: palette.light.ac,
    })
  })
})
