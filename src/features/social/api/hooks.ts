import { infiniteQueryOptions, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { Alert } from 'react-native'
import { showToast, TOAST_ABOVE } from '@/shared/components'
import type { PostCategory } from '@push/api-client'
import { SAVE_COPY } from '../constants'
import type { SocialImage } from '../types'
import { invalidateAfterPostSaveToggle } from '../utils/post-save'
import { createComment, createPost, fetchComments, fetchPost, fetchPosts, savePost, unsavePost, uploadPostImage } from './fetchers'

export const postsQuery = (category: PostCategory | null) =>
  infiniteQueryOptions({
    queryKey: ['posts', category],
    queryFn: ({ pageParam }) => fetchPosts(category, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.page.nextCursor ?? undefined,
  })

export const usePosts = (category: PostCategory | null) => useInfiniteQuery(postsQuery(category))

export const usePost = (id: string) => useQuery({ queryKey: ['post', id], queryFn: () => fetchPost(id) })

export const useComments = (id: string, enabled: boolean) =>
  useInfiniteQuery({
    queryKey: ['comments', id],
    queryFn: ({ pageParam }) => fetchComments(id, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.page.nextCursor ?? undefined,
    enabled,
  })

export const useCreateComment = (postId: string, onSent: () => void) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ text, parentId }: { text: string; parentId?: string }) => createComment(postId, text.trim(), parentId),
    onSuccess: () => {
      onSent()
      void qc.invalidateQueries({ queryKey: ['comments', postId] })
      void qc.invalidateQueries({ queryKey: ['post', postId] })
      void qc.invalidateQueries({ queryKey: ['posts'] })
    },
    onError: () => Alert.alert('댓글을 남기지 못했어요', '잠시 후 다시 시도해 주세요.'),
  })
}

export const useCreatePost = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      category,
      title,
      body,
      images,
    }: {
      category: PostCategory
      title: string
      body: string
      images: SocialImage[]
    }) => {
      const imageKeys = await Promise.all(images.map(uploadPostImage))
      return createPost({ category, title: title.trim(), body: body.trim(), imageKeys })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['posts'] })
      router.back()
    },
    onError: () => Alert.alert('글을 올리지 못했어요', '잠시 후 다시 시도해 주세요.'),
  })
}

export const useTogglePostSave = (id: string) => {
  const qc = useQueryClient()
  const mutation = useMutation({
    mutationFn: (next: boolean) => (next ? savePost(id) : unsavePost(id)),
    onSuccess: (_data, next) => {
      void invalidateAfterPostSaveToggle(qc, id)
      showToast({
        message: next ? SAVE_COPY.saved : SAVE_COPY.unsaved,
        bottom: TOAST_ABOVE.cta,
        action: next
          ? { label: SAVE_COPY.view, onPress: () => router.push({ pathname: '/activity/posts', params: { box: 'saved' } }) }
          : { label: SAVE_COPY.undo, onPress: () => mutation.mutate(true) },
      })
    },
    onError: () => showToast({ message: SAVE_COPY.failed, tone: 'error', bottom: TOAST_ABOVE.cta }),
  })
  return mutation
}
