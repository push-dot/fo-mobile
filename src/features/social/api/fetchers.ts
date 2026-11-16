import type { PostCategory } from '@push/api-client'
import { api } from '../../../shared/infrastructure'
import type { SocialImage } from '../types'

// shortcut: Post has no saved flag, so a post saved beyond the newest 100 reads as unsaved; upgrade when push-be adds the flag.
const SAVED_IDS_LIMIT = 100

export const fetchPosts = (category: PostCategory | null, cursor: string | undefined) => api.posts.list(category, { cursor })

export const fetchPost = (id: string) => api.posts.get(id)

export const fetchComments = (id: string, cursor: string | undefined) => api.posts.comments(id, { cursor })

export const createComment = (postId: string, text: string, parentId?: string) => api.posts.comment(postId, text, parentId)

export const uploadPostImage = async ({ uri, name: fileName, mimeType }: SocialImage) => {
  const form = new FormData()
  const type = mimeType ?? 'image/jpeg'
  form.append('file', { uri, name: fileName ?? `image.${type.split('/')[1]}`, type } as unknown as Blob)
  return (await api.uploads.image(form)).key
}

export const createPost = (input: { category: PostCategory; title: string; body: string; imageKeys: string[] }) => api.posts.create(input)

export const savePost = (id: string) => api.posts.save(id)

export const unsavePost = (id: string) => api.posts.unsave(id)

export const fetchSavedPostIds = async () => (await api.me.savedPosts({ limit: SAVED_IDS_LIMIT })).data.map((p) => p.id)
