export type PushPermission = 'granted' | 'denied' | 'undetermined'
export type PushPlatform = 'ios' | 'android'

export type PushDevicePorts = {
  permission: () => Promise<PushPermission>
  request: () => Promise<PushPermission>
  token: () => Promise<string | null>
  platform: () => PushPlatform | null
  register: (token: string, platform: PushPlatform) => Promise<void>
  remove: (token: string) => Promise<void>
}

export const createPushDevice = (ports: PushDevicePorts) => {
  let userId: string | null = null
  let registeredToken: string | null = null
  let asked = false
  let generation = 0

  const register = async (gen: number) => {
    if (registeredToken || !userId) return
    const platform = ports.platform()
    if (!platform) return
    const token = await ports.token()
    if (gen !== generation || !userId || !token) return
    await ports.register(token, platform)
    if (gen !== generation || !userId) {
      try {
        await ports.remove(token)
      } catch {
        registeredToken = token
      }
      return
    }
    registeredToken = token
  }

  return {
    signIn: async (id: string) => {
      if (userId === id) return
      const leftover = registeredToken
      userId = id
      asked = false
      registeredToken = null
      const gen = ++generation
      if (leftover) {
        await ports.remove(leftover).catch(() => undefined)
        if (gen !== generation) return
      }
      const permission = await ports.permission()
      if (gen !== generation || userId !== id) return
      if (permission !== 'granted') return
      await register(gen)
    },
    signOut: async () => {
      generation += 1
      userId = null
      asked = false
      const token = registeredToken
      if (!token) return
      try {
        await ports.remove(token)
        if (registeredToken === token) registeredToken = null
      } catch {
        return
      }
    },
    botJob: async () => {
      if (!userId || asked || registeredToken) return
      asked = true
      const gen = generation
      const id = userId
      let permission: PushPermission
      try {
        permission = await ports.request()
      } catch {
        return
      }
      if (gen !== generation || userId !== id) return
      if (permission !== 'granted') return
      await register(gen)
    },
  }
}

export const tapSend = <A extends unknown[], R>(send: (...args: A) => R, onJob: () => void) =>
  (...args: A): R => {
    try {
      onJob()
    } catch {
      return send(...args)
    }
    return send(...args)
  }
