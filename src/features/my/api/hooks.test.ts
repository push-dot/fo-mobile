import { describe, expect, it, vi } from 'vitest'

vi.mock('react-native', () => ({ Alert: { alert: vi.fn() } }))
vi.mock('expo-router', () => ({ router: {} }))
vi.mock('@/shared/components', () => ({}))
vi.mock('@/shared/infrastructure', () => ({}))
vi.mock('./fetchers', () => new Proxy({}, { has: (_, k) => k !== 'then', get: (_, k) => (k === 'then' ? undefined : vi.fn()) }))
const { calendarEventsQuery } = await import('./hooks')

describe('calendarEventsQuery', () => {
  it('keeps ranges that start on the same day apart', () => {
    const from = '2026-11-01T00:00:00.000Z'
    const day = calendarEventsQuery(from, '2026-11-02T00:00:00.000Z').queryKey
    const month = calendarEventsQuery(from, '2026-12-01T00:00:00.000Z').queryKey
    expect(day).not.toEqual(month)
  })
})
