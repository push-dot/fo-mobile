import type { Href } from 'expo-router'
import type { AppNotification } from '@push/api-client'
import { MY_TAB_PATH } from '../../constants'

export const notificationHref = ({ target }: Pick<AppNotification, 'target'>): Href | null => {
  switch (target.kind) {
    case 'posting':
      return `/postings/${target.id}`
    case 'offer':
      return `/offers/${target.id}`
    case 'post':
      return `/posts/${target.id}`
    case 'conversation':
      return `/chat/${target.id}`
    case 'calendar':
      return { pathname: MY_TAB_PATH, params: { tab: 'activity', sub: 'calendar' } }
    case 'activity':
      return { pathname: MY_TAB_PATH, params: { tab: 'activity', sub: 'applications' } }
    default:
      return null
  }
}
