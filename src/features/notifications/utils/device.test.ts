import { describe, expect, it, vi } from 'vitest'
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

describe('push device retry', () => {
  it('registers on a second sign-in with the same id after a rejected register', async () => {
    const registers: string[] = []
    let fail = true
    const device = createPushDevice({
      permission: async () => 'granted',
      request: async () => 'granted',
      token: async () => TOKEN,
      platform: () => 'ios',
      register: async (token) => {
        if (fail) throw new Error('offline')
        registers.push(token)
      },
      remove: async () => {},
    })
    await expect(device.signIn('u1')).rejects.toThrow('offline')
    fail = false
    await device.signIn('u1')
    await device.signIn('u1')
    expect(registers).toEqual([TOKEN])
  })

  it('does not start a second register while one is in flight', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => { release = resolve })
    const registers: string[] = []
    const device = createPushDevice({
      permission: async () => 'granted',
      request: async () => 'granted',
      token: async () => TOKEN,
      platform: () => 'ios',
      register: async (token) => {
        registers.push(token)
        await gate
      },
      remove: async () => {},
    })
    const first = device.signIn('u1')
    await device.signIn('u1')
    release()
    await first
    expect(registers).toEqual([TOKEN])
  })

  it('does not restart a bot-job register when the permission dialog returns the app to active', async () => {
    let grant: (permission: PushPermission) => void = () => {}
    const registers: string[] = []
    const removes: string[] = []
    const device = createPushDevice({
      permission: async () => 'undetermined',
      request: () => new Promise((resolve) => { grant = resolve }),
      token: async () => TOKEN,
      platform: () => 'ios',
      register: async (token) => { registers.push(token) },
      remove: async (token) => { removes.push(token) },
    })
    await device.signIn('u1')
    const job = device.botJob()
    await device.signIn('u1')
    grant('granted')
    await job
    expect(registers).toEqual([TOKEN])
    expect(removes).toEqual([])
  })

  it('keeps the token a newer sign-in registered while a stale register was in flight', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => { release = resolve })
    const registers: string[] = []
    const removes: string[] = []
    const device = createPushDevice({
      permission: async () => 'granted',
      request: async () => 'granted',
      token: async () => TOKEN,
      platform: () => 'ios',
      register: async (token) => {
        registers.push(token)
        if (registers.length === 1) await gate
      },
      remove: async (token) => { removes.push(token) },
    })
    const stale = device.signIn('u1')
    await vi.waitFor(() => expect(registers).toHaveLength(1))
    await device.signOut()
    await device.signIn('u2')
    release()
    await stale
    expect(registers).toEqual([TOKEN, TOKEN])
    expect(removes).toEqual([])
    await device.signOut()
    expect(removes).toEqual([TOKEN])
  })

  it('removes a stale register when no newer sign-in claimed the token', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => { release = resolve })
    const removes: string[] = []
    let registering = false
    const device = createPushDevice({
      permission: async () => 'granted',
      request: async () => 'granted',
      token: async () => TOKEN,
      platform: () => 'ios',
      register: () => {
        registering = true
        return gate
      },
      remove: async (token) => { removes.push(token) },
    })
    const stale = device.signIn('u1')
    await vi.waitFor(() => expect(registering).toBe(true))
    await device.signOut()
    release()
    await stale
    expect(removes).toEqual([TOKEN])
  })

  it('keeps the newer token when a stale register resolves while the newer one is in flight', async () => {
    const gates: (() => void)[] = []
    const registers: string[] = []
    const removes: string[] = []
    const device = createPushDevice({
      permission: async () => 'granted',
      request: async () => 'granted',
      token: async () => TOKEN,
      platform: () => 'ios',
      register: (token) => {
        registers.push(token)
        return new Promise<void>((resolve) => { gates.push(resolve) })
      },
      remove: async (token) => { removes.push(token) },
    })
    const stale = device.signIn('u1')
    await vi.waitFor(() => expect(gates).toHaveLength(1))
    await device.signOut()
    const newer = device.signIn('u2')
    await vi.waitFor(() => expect(gates).toHaveLength(2))
    gates[0]?.()
    await stale
    expect(removes).toEqual([])
    gates[1]?.()
    await newer
    await device.signIn('u2')
    expect(registers).toEqual([TOKEN, TOKEN])
    await device.signOut()
    expect(removes).toEqual([TOKEN])
  })

  it('registers the newer sign-in when a stale remove fails before the newer one claims the token', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => { release = resolve })
    let grant: (permission: PushPermission) => void = () => {}
    let permissions = 0
    const registers: string[] = []
    const device = createPushDevice({
      permission: () => {
        permissions += 1
        if (permissions === 1) return Promise.resolve('granted')
        return new Promise((resolve) => { grant = resolve })
      },
      request: async () => 'granted',
      token: async () => TOKEN,
      platform: () => 'ios',
      register: async (token) => {
        registers.push(token)
        if (registers.length === 1) await gate
      },
      remove: async () => {
        throw new Error('offline')
      },
    })
    const stale = device.signIn('u1')
    await vi.waitFor(() => expect(registers).toHaveLength(1))
    await device.signOut()
    const newer = device.signIn('u2')
    await vi.waitFor(() => expect(permissions).toBe(2))
    release()
    await stale
    grant('granted')
    await newer
    expect(registers).toEqual([TOKEN, TOKEN])
  })

  it('retries removing a stale token at the next sign-in when the stale remove failed', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => { release = resolve })
    let registers = 0
    let failRemove = true
    const removes: string[] = []
    const device = createPushDevice({
      permission: async () => 'granted',
      request: async () => 'granted',
      token: async () => TOKEN,
      platform: () => 'ios',
      register: async () => {
        registers += 1
        if (registers === 1) await gate
      },
      remove: async (token) => {
        if (failRemove) {
          failRemove = false
          throw new Error('offline')
        }
        removes.push(token)
      },
    })
    const stale = device.signIn('u1')
    await vi.waitFor(() => expect(registers).toBe(1))
    await device.signOut()
    release()
    await stale
    await device.signIn('u2')
    expect(removes).toEqual([TOKEN])
  })

  it('waits for a pending stale remove before the newer sign-in registers', async () => {
    let releaseRegister: () => void = () => {}
    const registerGate = new Promise<void>((resolve) => { releaseRegister = resolve })
    let releaseRemove: () => void = () => {}
    const removeGate = new Promise<void>((resolve) => { releaseRemove = resolve })
    let grant: (permission: PushPermission) => void = () => {}
    let permissions = 0
    const events: string[] = []
    const device = createPushDevice({
      permission: () => {
        permissions += 1
        if (permissions === 1) return Promise.resolve('granted')
        return new Promise((resolve) => { grant = resolve })
      },
      request: async () => 'granted',
      token: async () => TOKEN,
      platform: () => 'ios',
      register: async () => {
        events.push('register')
        if (events.length === 1) await registerGate
      },
      remove: async () => {
        events.push('remove')
        await removeGate
        events.push('removed')
      },
    })
    const stale = device.signIn('u1')
    await vi.waitFor(() => expect(events).toEqual(['register']))
    await device.signOut()
    const newer = device.signIn('u2')
    await vi.waitFor(() => expect(permissions).toBe(2))
    releaseRegister()
    await vi.waitFor(() => expect(events).toEqual(['register', 'remove']))
    grant('granted')
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(events).toEqual(['register', 'remove'])
    releaseRemove()
    await stale
    await newer
    expect(events).toEqual(['register', 'remove', 'removed', 'register'])
  })

  it('removes an orphaned stale token at sign-out when the newer register failed', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => { release = resolve })
    let grant: (permission: PushPermission) => void = () => {}
    let permissions = 0
    let registers = 0
    let failRemove = true
    const removes: string[] = []
    const device = createPushDevice({
      permission: () => {
        permissions += 1
        if (permissions === 1) return Promise.resolve('granted')
        return new Promise((resolve) => { grant = resolve })
      },
      request: async () => 'granted',
      token: async () => TOKEN,
      platform: () => 'ios',
      register: async () => {
        registers += 1
        if (registers === 1) await gate
        else throw new Error('offline')
      },
      remove: async (token) => {
        if (failRemove) {
          failRemove = false
          throw new Error('offline')
        }
        removes.push(token)
      },
    })
    const stale = device.signIn('u1')
    await vi.waitFor(() => expect(registers).toBe(1))
    await device.signOut()
    const newer = device.signIn('u2')
    await vi.waitFor(() => expect(permissions).toBe(2))
    release()
    await stale
    grant('granted')
    await expect(newer).rejects.toThrow('offline')
    expect(removes).toEqual([])
    await device.signOut()
    expect(removes).toEqual([TOKEN])
  })

  it('does not ask again after a same-id retry', async () => {
    const { device, asks } = harness('undetermined', 'denied')
    await device.signIn('u1')
    await device.botJob()
    await device.signIn('u1')
    await device.botJob()
    expect(asks()).toBe(1)
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
