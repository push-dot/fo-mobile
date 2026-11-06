import { describe, expect, it } from 'vitest'
import { inputMetrics } from '../text-field-metrics'

describe('text field input height', () => {
  it('keeps the pre-scaling heights at font scale 1.0', () => {
    expect(inputMetrics(true, 1)).toEqual({ lineHeight: 24, minHeight: 96 })
    expect(inputMetrics(false, 1)).toEqual({ minHeight: 24 })
  })

  it('grows multiline by its four rows and single line by one at large text', () => {
    expect(inputMetrics(true, 1.3).minHeight).toBeCloseTo(4 * 24 * 1.3)
    expect(inputMetrics(false, 2)).toEqual({ minHeight: 48 })
  })
})
