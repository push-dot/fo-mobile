import { afterEach, describe, expect, it, vi } from 'vitest'

const versionOn = async (os: string) => {
  vi.stubEnv('EXPO_OS', os)
  vi.resetModules()
  return (await import('./a2ui-version')).A2UI_VERSION
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('A2UI_VERSION', () => {
  it('is 1.0 on iOS, the protocol its renderer and catalog speak', async () => {
    expect(await versionOn('ios')).toBe('1.0')
  })

  it('is v0.9.1 on Android, the newest its official renderer reads', async () => {
    expect(await versionOn('android')).toBe('v0.9.1')
  })
})
