import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { Alert } from 'react-native'
import type { PostCategory } from '@push/api-client'
import { api, pickImage } from '../../../shared/infrastructure'
import { MAX_BYTES, MAX_IMAGES, TYPES } from '../constants'

export type SocialImage = {
  uri: string
  name: string | null | undefined
  mimeType: string | null | undefined
  size: number | null | undefined
}

const upload = async ({ uri, name: fileName, mimeType }: SocialImage) => {
  const form = new FormData()
  const type = mimeType ?? 'image/jpeg'
  form.append('file', { uri, name: fileName ?? `image.${type.split('/')[1]}`, type } as unknown as Blob)
  return (await api.uploads.image(form)).key
}

export const pickPostImages = async (count: number): Promise<SocialImage[] | null> => {
  const res = await pickImage({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: MAX_IMAGES - count,
    quality: 0.85,
  })
  if (res.canceled) return null
  const mapped = res.assets.map((a) => ({
    uri: a.uri,
    name: a.fileName,
    mimeType: a.mimeType,
    size: a.fileSize,
  }))
  const ok = mapped.filter(({ mimeType, size }) => (!mimeType || TYPES.includes(mimeType)) && (size ?? 0) <= MAX_BYTES)
  if (ok.length < res.assets.length) Alert.alert('올릴 수 없는 사진이 있어요', 'JPG, PNG, WEBP, HEIC 사진만 장당 10MB까지 올릴 수 있어요.')
  return ok
}

export const usePosts = (category: PostCategory | null) =>
  useInfiniteQuery({
    queryKey: ['posts', category],
    queryFn: ({ pageParam }) => api.posts.list(category, { cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.page.nextCursor ?? undefined,
  })

export const usePost = (id: string) => useQuery({ queryKey: ['post', id], queryFn: () => api.posts.get(id) })

export const useComments = (id: string, enabled: boolean) =>
  useInfiniteQuery({
    queryKey: ['comments', id],
    queryFn: ({ pageParam }) => api.posts.comments(id, { cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.page.nextCursor ?? undefined,
    enabled,
  })

export const useCreateComment = (postId: string, onSent: () => void) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ text, parentId }: { text: string; parentId?: string }) => api.posts.comment(postId, text.trim(), parentId),
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
      const imageKeys = await Promise.all(images.map(upload))
      return api.posts.create({ category, title: title.trim(), body: body.trim(), imageKeys })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['posts'] })
      router.back()
    },
    onError: () => Alert.alert('글을 올리지 못했어요', '잠시 후 다시 시도해 주세요.'),
  })
}
