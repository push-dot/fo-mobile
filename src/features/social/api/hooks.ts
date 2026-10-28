import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { Alert } from 'react-native'
import type { PostCategory } from '@push/api-client'
import type { SocialImage } from '../types'
import { createComment, createPost, fetchComments, fetchPost, fetchPosts, uploadPostImage } from './fetchers'

export const usePosts = (category: PostCategory | null) =>
  useInfiniteQuery({
    queryKey: ['posts', category],
    queryFn: ({ pageParam }) => fetchPosts(category, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.page.nextCursor ?? undefined,
  })

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
