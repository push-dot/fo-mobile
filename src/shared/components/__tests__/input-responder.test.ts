import { describe, expect, it } from 'vitest'
import { inputResponder } from '../input-responder'

describe('input responder', () => {
  it('lets another touch take the responder from a focused input, so the first tap on a button beside it fires onPressIn', () => {
    expect(inputResponder).toEqual({ rejectResponderTermination: false })
  })
})
