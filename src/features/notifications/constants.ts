import type { SkeletonRowsShape } from '../../shared/components'

export const NOTIFICATION_PAGE_LIMIT = 50
export const NOTIFICATION_EMPTY = '아직 받은 알림이 없어요.'
export const NOTIFICATION_SETTINGS_LABEL = '알림 설정'
export const MY_TAB_PATH = '/(tabs)/(my)/my'

export const NOTIFICATION_SKELETON: SkeletonRowsShape = {
  count: 6,
  lead: { size: 44, radius: 15 },
  lines: [
    { width: '35%', height: 12 },
    { width: '90%', height: 16 },
  ],
}
