import { MAX_BYTES, TYPES } from '../constants'
import type { SocialImage } from '../types'

export const toSocialImage = (file: {
  uri: string
  fileName?: string | null
  mimeType?: string | null
  fileSize?: number | null
}): SocialImage => ({
  uri: file.uri,
  name: file.fileName,
  mimeType: file.mimeType,
  size: file.fileSize,
})

export const acceptedPostImages = (images: SocialImage[]) =>
  images.filter((image) => (!image.mimeType || TYPES.includes(image.mimeType)) && (image.size ?? 0) <= MAX_BYTES)
