import { WEB_BASE_URL } from '../../../shared/infrastructure/config'
import type { Post } from '@push/api-client'

export const postUrl = (id: string) => `${WEB_BASE_URL}/posts/${id}`

export const postShareMessage = (id: string, post?: Pick<Post, 'title'>) => `${post ? `${post.title}\n` : ''}${postUrl(id)}`
