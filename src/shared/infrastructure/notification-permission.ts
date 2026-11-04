import * as Notifications from 'expo-notifications'

export const readNotificationPermission = () => Notifications.getPermissionsAsync()
