import { describe, expect, it } from 'vitest'
import { palette } from '../../theme/tokens'
import { chipFrame } from './chip-frame'

describe('chipFrame', () => {
  it('keeps the accent ring off an unselected chip', () => {
    expect(chipFrame(false, palette.light)).toEqual({ backgroundColor: palette.light.fill, overflow: 'hidden' })
    expect(chipFrame(false, palette.light)).not.toMatchObject({ borderColor: palette.light.ac })
  })

  it('uses the shared selected ring when the chip is on', () => {
    expect(chipFrame(true, palette.light)).toMatchObject({
      backgroundColor: palette.light.acSoft,
      borderColor: palette.light.ac,
      borderWidth: 1.5,
    })
  })
})
