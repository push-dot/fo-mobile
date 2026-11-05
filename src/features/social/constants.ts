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
export const AVATAR_COLORS = ['#1971C2', '#D6336C', '#2F9E44', '#E8590C', '#C2255C', '#5B4CF0', '#0C8599']
export const MIN = 60_000
export const HOUR = 60 * MIN
export const DAY = 24 * HOUR
