import type { Href } from 'expo-router'
import type { Icon3DName } from '@/shared/components'

export const HOME_POSTING_LIMIT = 10

export const SHORTCUTS: { label: string; icon: Icon3DName; glow: string; opacity: number; href: Href }[] = [
  { label: '채용공고', icon: 'brief', glow: '#6C5CF5', opacity: 0.3, href: '/jobs' },
  { label: '북마크', icon: 'bookmark', glow: '#FF8A2A', opacity: 0.28, href: { pathname: '/(tabs)/(my)/my', params: { tab: 'activity', sub: 'bookmarks' } } },
  { label: '내 활동', icon: 'chart', glow: '#12A866', opacity: 0.26, href: { pathname: '/(tabs)/(my)/my', params: { tab: 'activity', sub: 'applications' } } },
]
