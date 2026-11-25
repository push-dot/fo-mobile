export { POST_CATEGORIES } from '@push/api-client'

export const MAX_COMMENT = 1000
export const TITLE_MAX = 100
export const TITLE_LABEL = '제목'
export const TITLE_HINT = '1–100자'
export const BODY_LABEL = '본문'
export const MAX_IMAGES = 4
export const FEED_SKELETON_CARDS = 3
export const MAX_BYTES = 10 * 1024 * 1024
export const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
export const POST_IMAGE_OPTIONS = {
  mediaTypes: ['images' as const],
  allowsMultipleSelection: true,
  quality: 0.85,
}
export const SAVE_COPY = {
  save: '저장',
  unsave: '저장 해제',
  saved: '저장했어요',
  unsaved: '저장을 해제했어요',
  view: '보기',
  undo: '되돌리기',
  failed: '잠시 후 다시 시도해 주세요',
} as const
