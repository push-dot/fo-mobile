import { describe, expect, it } from 'vitest'
import { userBubbleFill } from './user-bubble'

describe('user bubble fill', () => {
  it('is the chat board audit grey in both schemes', () => {
    expect(userBubbleFill).toEqual({ light: '#E1E4E8', dark: '#383C43' })
  })
})