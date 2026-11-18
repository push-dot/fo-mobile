import { useEffect, useState } from 'react'
import { AppState } from 'react-native'
import { router } from 'expo-router'
import {
  botApi,
  openSystemSettings,
  pushPlatform,
  readLastPushOpen,
  readNotificationPermission,
  readPushToken,
  requestNotificationPermission,
  subscribePushOpens,
  useSession,
} from '@/shared/infrastructure'
import { registerPushDevice, removePushDevice } from './api/fetchers'
import {
  createPushDevice,
  notificationHrefFromPush,
  pushPermissionOf,
  showNotificationSettings,
  tapSend,
  type NotificationPermissionSnapshot,
} from './utils'

const snapshotOf = (
  settings: Awaited<ReturnType<typeof readNotificationPermission>>,
): NotificationPermissionSnapshot => ({
  status: settings.status,
  iosStatus: settings.ios?.status,
})

export const useNotificationSettingsVisible = () => {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    let live = true
    const load = () => {
      readNotificationPermission()
        .then((settings) => {
          if (live) setVisible(showNotificationSettings(snapshotOf(settings)))
        })
        .catch(() => {
          if (live) setVisible(false)
        })
    }
    load()
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') load()
    })
    return () => {
      live = false
      sub.remove()
    }
  }, [])
  return visible
}

export const openNotificationSettings = () => {
  void openSystemSettings()
}

let started = false
let openedPush: string | null = null

const settle = (job: Promise<void>) => {
  void job.catch(() => undefined)
}

const openPush = (id: string | null, data: unknown) => {
  if (id && openedPush === id) return
  if (id) openedPush = id
  const href = notificationHrefFromPush(data)
  if (href) router.push(href)
}

export const usePushDevice = () => {
  useEffect(() => {
    if (started) return
    started = true
    const device = createPushDevice({
      permission: async () => pushPermissionOf(snapshotOf(await readNotificationPermission())),
      request: async () => pushPermissionOf(snapshotOf(await requestNotificationPermission())),
      token: readPushToken,
      platform: pushPlatform,
      register: registerPushDevice,
      remove: removePushDevice,
    })
    const send = botApi.bots.send.bind(botApi.bots)
    botApi.bots.send = tapSend(send, () => {
      settle(device.botJob())
    })
    const id = useSession.getState().session?.user.id
    if (id) settle(device.signIn(id))
    useSession.subscribe((next, prev) => {
      const nextId = next.session?.user.id ?? null
      const prevId = prev.session?.user.id ?? null
      if (nextId === prevId) return
      if (!nextId) settle(device.signOut())
      else settle(device.signIn(nextId))
    })
    subscribePushOpens((open) => {
      openPush(open.id, open.data)
    })
    const cold = readLastPushOpen()
    if (cold) openPush(cold.id, cold.data)
  }, [])
}
