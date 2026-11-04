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

export const showNotificationSettings = (snapshot: NotificationPermissionSnapshot | null) =>
  snapshot !== null && notificationPermissionOff(snapshot)
