import { describe, expect, it } from 'vitest'
import { userBubbleChipFill, userBubbleFill } from './user-bubble'

describe('user bubble fill', () => {
  it('is the chat board audit grey in both schemes', () => {
    expect(userBubbleFill).toEqual({ light: '#E1E4E8', dark: '#383C43' })
  })
  it('puts the file chip at the bubble veiled by 8% black (light) or 10% white (dark)', () => {
    const veil = (from: string, to: number, a: number) => {
      const ch = [1, 3, 5].map((i) => Math.round(parseInt(from.slice(i, i + 2), 16) * (1 - a) + to * a))
      return `#${ch.map((n) => n.toString(16).padStart(2, '0')).join('').toUpperCase()}`
    }
    expect(userBubbleChipFill.light).toBe(veil(userBubbleFill.light, 0, 0.08))
    expect(userBubbleChipFill.dark).toBe(veil(userBubbleFill.dark, 255, 0.1))
  })
})
