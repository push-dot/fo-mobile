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
  let claim: { gen: number; token: string } | null = null

  const register = async (gen: number) => {
    if (registeredToken || !userId) return
    const platform = ports.platform()
    if (!platform) return
    const token = await ports.token()
    if (gen !== generation || !userId || !token) return
    claim = { gen, token }
    await ports.register(token, platform)
    if (gen !== generation || !userId) {
      if (claim.gen === generation && claim.token === token) return
      try {
        await ports.remove(token)
      } catch {
        if (!userId) registeredToken = token
      }
      return
    }
    registeredToken = token
  }

  let inflight = 0
  const track = async (job: Promise<void>) => {
    inflight += 1
    try {
      await job
    } finally {
      inflight -= 1
    }
  }

  const start = async (id: string) => {
    const leftover = registeredToken
    if (userId !== id) asked = false
    userId = id
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
  }

  return {
    signIn: async (id: string) => {
      if (userId === id && (registeredToken || inflight)) return
      await track(start(id))
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
      await track((async () => {
        let permission: PushPermission
        try {
          permission = await ports.request()
        } catch {
          return
        }
        if (gen !== generation || userId !== id) return
        if (permission !== 'granted') return
        await register(gen)
      })())
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
