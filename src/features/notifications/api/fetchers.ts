import { api } from '../../../shared/infrastructure'
import { NOTIFICATION_PAGE_LIMIT } from '../constants'

export const fetchNotifications = () => api.me.notifications({ limit: NOTIFICATION_PAGE_LIMIT })

export const readNotifications = (ids: string[] | 'all') => api.me.readNotifications(ids)

export const registerPushDevice = (token: string, platform: 'ios' | 'android') =>
  api.me.registerDevice(token, platform)

export const removePushDevice = (token: string) => api.me.unregisterDevice(token)
