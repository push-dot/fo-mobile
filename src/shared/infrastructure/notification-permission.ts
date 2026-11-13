import * as Notifications from 'expo-notifications'
import { AndroidImportance } from 'expo-notifications'
import { Platform } from 'react-native'

export const readNotificationPermission = () => Notifications.getPermissionsAsync()

// Android 13+ shows no permission prompt, and a token call fails, until a notification channel exists; creating it again is a no-op.
const ensureAndroidChannel = async () => {
  if (Platform.OS !== 'android') return
  await Notifications.setNotificationChannelAsync('default', { name: '알림', importance: AndroidImportance.DEFAULT })
}

export const requestNotificationPermission = async () => {
  await ensureAndroidChannel()
  return Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  })
}

export const readPushToken = async () => {
  try {
    await ensureAndroidChannel()
    const token = await Notifications.getExpoPushTokenAsync()
    return token.data || null
  } catch {
    return null
  }
}

export const pushPlatform = (): 'ios' | 'android' | null =>
  Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : null

type PushOpen = { id: string; data: unknown }

export const readLastPushOpen = (): PushOpen | null => {
  try {
    const response = Notifications.getLastNotificationResponse()
    if (!response) return null
    return {
      id: response.notification.request.identifier,
      data: response.notification.request.content.data,
    }
  } catch {
    return null
  }
}

export const subscribePushOpens = (onOpen: (open: PushOpen) => void) => {
  try {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      onOpen({
        id: response.notification.request.identifier,
        data: response.notification.request.content.data,
      })
    })
    return () => {
      sub.remove()
    }
  } catch {
    return () => undefined
  }
}
