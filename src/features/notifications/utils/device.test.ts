import { describe, expect, it } from 'vitest'
import { createPushDevice, type PushPermission, tapSend } from './device'

const TOKEN = 'ExponentPushToken[a]'

const harness = (permission: PushPermission, request: PushPermission = permission) => {
  const registers: string[] = []
  const removes: string[] = []
  let asks = 0
  const device = createPushDevice({
    permission: async () => permission,
    request: async () => {
      asks += 1
      return request
    },
    token: async () => TOKEN,
    platform: () => 'ios',
    register: async (token, platform) => {
      registers.push(`${token} ${platform}`)
    },
    remove: async (token) => {
      removes.push(token)
    },
  })
  return { device, registers, removes, asks: () => asks }
}

describe('push device', () => {
  it('registers once per sign-in when permission is already granted', async () => {
    const { device, registers, asks } = harness('granted')
    await device.signIn('u1')
    await device.signIn('u1')
    expect(registers).toEqual([`${TOKEN} ios`])
    expect(asks()).toBe(0)
    await device.signOut()
    await device.signIn('u1')
    expect(registers).toEqual([`${TOKEN} ios`, `${TOKEN} ios`])
  })

  it('removes the device at sign-out', async () => {
    const { device, removes } = harness('granted')
    await device.signOut()
    expect(removes).toEqual([])
    await device.signIn('u1')
    await device.signOut()
    expect(removes).toEqual([TOKEN])
  })

  it('does not register without permission', async () => {
    const denied = harness('denied', 'denied')
    await denied.device.signIn('u1')
    await denied.device.botJob()
    await denied.device.botJob()
    expect(denied.registers).toEqual([])
    expect(denied.asks()).toBe(1)

    const waiting = harness('undetermined', 'denied')
    await waiting.device.signIn('u1')
    expect(waiting.registers).toEqual([])
    expect(waiting.asks()).toBe(0)
  })

  it('asks at the first bot job and registers only if the ask is granted', async () => {
    const { device, registers, asks } = harness('undetermined', 'granted')
    await device.signIn('u1')
    expect(asks()).toBe(0)
    await device.botJob()
    await device.botJob()
    expect(asks()).toBe(1)
    expect(registers).toEqual([`${TOKEN} ios`])
  })

  it('does not register a sign-in that ended before permission came back', async () => {
    let release: (permission: PushPermission) => void = () => {}
    const registers: string[] = []
    const device = createPushDevice({
      permission: () => new Promise((resolve) => { release = resolve }),
      request: async () => 'granted',
      token: async () => TOKEN,
      platform: () => 'ios',
      register: async (token, platform) => { registers.push(`${token} ${platform}`) },
      remove: async () => {},
    })
    const pending = device.signIn('u1')
    await device.signOut()
    release('granted')
    await pending
    expect(registers).toEqual([])
  })
})

describe('bot job send', () => {
  it('runs the send and counts the job even when the ask throws', () => {
    let jobs = 0
    const send = tapSend((text: string) => text, () => {
      jobs += 1
      throw new Error('ask failed')
    })
    expect(send('hi')).toBe('hi')
    expect(jobs).toBe(1)
  })
})
