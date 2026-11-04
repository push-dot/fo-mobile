import type { Post } from '@push/api-client'
import { categoryLabel } from './category-label'
import { timeAgo } from './time-ago'

export const postInfo = (post: Pick<Post, 'author' | 'category' | 'createdAt'>, now?: Date) =>
  [post.author.displayName, categoryLabel(post.category), timeAgo(post.createdAt, now)]
    .filter(Boolean)
    .join(' · ')
