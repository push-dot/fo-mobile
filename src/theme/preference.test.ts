import { describe, expect, it, vi } from 'vitest'

const getItemAsync = vi.hoisted(() => vi.fn())

vi.mock('expo-secure-store', () => ({ getItemAsync, setItemAsync: vi.fn(async () => undefined) }))

describe('useThemePreference.load', () => {
  it('falls back to the system theme when the keychain read fails', async () => {
    const { useThemePreference } = await import('./preference')
    getItemAsync.mockRejectedValue(new Error('locked'))

    await useThemePreference.getState().load()

    expect(useThemePreference.getState()).toMatchObject({ choice: 'system', ready: true })
  })
})
