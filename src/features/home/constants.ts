import type { Href } from 'expo-router'
import type { Icon3DName } from '@/shared/components'

export const HOME_POSTING_LIMIT = 10
export const SECTION_ERROR_LINES = ['공고를 불러오지 못했어요.', '잠시 후 다시 열어 주세요.'] as const
export const SECTION_RETRY_LABEL = '다시 시도'
export const SECTION_SKELETON_CARDS = 2
export const SECTION_SKELETON_CARD_WIDTH = 200

export const SHORTCUTS: { label: string; icon: Icon3DName; glow: string; opacity: number; href: Href }[] = [
  { label: '채용공고', icon: 'brief', glow: '#6C5CF5', opacity: 0.3, href: '/jobs' },
  { label: '북마크', icon: 'bookmark', glow: '#FF8A2A', opacity: 0.28, href: { pathname: '/(app)/(stack)/(tabs)/(my)/my', params: { tab: 'activity', sub: 'bookmarks' } } },
  { label: '내 활동', icon: 'chart', glow: '#12A866', opacity: 0.26, href: { pathname: '/(app)/(stack)/(tabs)/(my)/my', params: { tab: 'activity', sub: 'applications' } } },
]
