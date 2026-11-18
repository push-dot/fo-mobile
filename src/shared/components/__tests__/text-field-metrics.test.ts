import { describe, expect, it, vi } from 'vitest'
import { inputMetrics, inputReset, iosLineBox } from '../text-field-metrics'

vi.mock('react-native', () => ({ Platform: { OS: 'android' } }))

describe('text field input height', () => {
  it('keeps the pre-scaling heights at font scale 1.0', () => {
    expect(inputMetrics(true, 1)).toEqual({ ...inputReset, lineHeight: 24, minHeight: 96 })
    expect(inputMetrics(false, 1)).toEqual({ ...inputReset, minHeight: 24 })
  })

  it('grows multiline by its four rows and single line by one at large text', () => {
    expect(inputMetrics(true, 1.3).minHeight).toBeCloseTo(4 * 24 * 1.3)
    expect(inputMetrics(false, 2)).toEqual({ ...inputReset, minHeight: 48 })
  })

  it('zeroes the Android EditText padding on every input', () => {
    expect(inputReset).toEqual({ padding: 0, includeFontPadding: false })
    expect(inputMetrics(false, 1)).toMatchObject(inputReset)
    expect(inputMetrics(true, 1)).toMatchObject(inputReset)
  })

  it('drops the iOS multiline top inset and lifts by the half-leading TextKit puts above the line', () => {
    expect(iosLineBox(24, 16, 1, 'ios')).toEqual({ paddingTop: 0, marginTop: expect.closeTo(-0.416), marginBottom: expect.closeTo(0.416) })
    expect(iosLineBox(25, 16, 1, 'ios')?.marginTop).toBeCloseTo(-0.916)
    expect(iosLineBox(24, 16, 1.5, 'ios')?.marginTop).toBeCloseTo(-0.624)
    expect(iosLineBox(20, 16, 1, 'ios')?.marginTop).toBe(-0)
    expect(iosLineBox(24, 16, 1, 'android')).toBeUndefined()
  })
})
