import { POST_CATEGORIES, type Post } from '@push/api-client'

export const categoryLabel = (key: Post['category']) => POST_CATEGORIES.find((c) => c.key === key)?.label ?? ''
