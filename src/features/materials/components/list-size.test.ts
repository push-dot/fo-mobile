import { describe, expect, it, vi } from 'vitest'

vi.mock('react-native', () => ({ useWindowDimensions: () => ({ fontScale: 1 }) }))
vi.mock('@/theme', async () => {
  const tokens = await import('@/theme/tokens')
  return { radius: tokens.radius, spacing: tokens.spacing }
})

const { listSizeFor } = await import('./list-size')

describe('listSizeFor', () => {
  it('draws MaterialsXL from the harness XL size, not only from 1.3', () => {
    expect(listSizeFor(1.235)).toBe(listSizeFor(1.5))
    expect(listSizeFor(1.235)).not.toBe(listSizeFor(1))
    expect(listSizeFor(1.15)).toBe(listSizeFor(1))
  })
})
