import { useEffect, useState } from 'react'
import { AppState } from 'react-native'
import { openSystemSettings, readNotificationPermission } from '@/shared/infrastructure'
import { showNotificationSettings, type NotificationPermissionSnapshot } from './utils'

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
