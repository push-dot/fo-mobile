import type { PushPermission } from './device'

export type NotificationPermissionSnapshot = {
  status: string
  iosStatus?: number
}

const IOS_NOT_DETERMINED = 0
const IOS_DENIED = 1

export const notificationPermissionOff = (snapshot: NotificationPermissionSnapshot) => {
  if (snapshot.iosStatus !== undefined) {
    return snapshot.iosStatus === IOS_NOT_DETERMINED || snapshot.iosStatus === IOS_DENIED
  }
  return snapshot.status !== 'granted'
}

export const pushPermissionOf = (snapshot: NotificationPermissionSnapshot): PushPermission => {
  if (!notificationPermissionOff(snapshot)) return 'granted'
  if (snapshot.iosStatus === IOS_DENIED || snapshot.status === 'denied') return 'denied'
  return 'undetermined'
}

export const showNotificationSettings = (snapshot: NotificationPermissionSnapshot | null) =>
  snapshot !== null && notificationPermissionOff(snapshot)
