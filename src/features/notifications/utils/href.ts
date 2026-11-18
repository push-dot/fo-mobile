import type { Href } from 'expo-router'
import type { AppNotification } from '@push/api-client'
import { botChatPath, botHomePath, type BotId } from '@/features/bots'
import { MY_TAB_PATH } from '../constants'

export const notificationHref = ({ target }: Pick<AppNotification, 'target'>): Href | null => {
  switch (target.kind) {
    case 'posting':
      return `/postings/${target.id}`
    case 'offer':
      return `/offers/${target.id}`
    case 'post':
      return `/posts/${target.id}`
    case 'conversation':
      return botHomePath
    case 'bot':
      return botChatPath(target.id as BotId)
    case 'calendar':
      return { pathname: MY_TAB_PATH, params: { tab: 'activity', sub: 'calendar' } }
    case 'activity':
      return { pathname: MY_TAB_PATH, params: { tab: 'activity', sub: 'applications' } }
    default:
      return null
  }
}

const isPushTarget = (data: unknown): data is AppNotification['target'] => {
  if (!data || typeof data !== 'object') return false
  const row = data as { kind?: unknown; id?: unknown }
  return typeof row.kind === 'string' && typeof row.id === 'string'
}

export const notificationHrefFromPush = (data: unknown): Href | null =>
  isPushTarget(data) ? notificationHref({ target: data }) : null
