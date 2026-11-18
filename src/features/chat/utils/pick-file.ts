import { Alert, Platform } from 'react-native'
import { MAX_BYTES, SIZE_LIMIT } from '@/features/my'
import { pickDocument } from '@/shared/infrastructure'
import { CHAT_ATTACHMENT_OPTIONS, CHAT_ATTACHMENT_OPTIONS_ANDROID, isChatAttachment } from '../constants'
import { attachDraftFile } from '../stores'

export const attachPickedFile = async (target: string) => {
  const picked = await pickDocument(Platform.OS === 'android' ? CHAT_ATTACHMENT_OPTIONS_ANDROID : CHAT_ATTACHMENT_OPTIONS)
  const asset = picked.canceled ? undefined : picked.assets[0]
  if (!asset) return false
  if (!isChatAttachment(asset.name)) {
    Alert.alert('올릴 수 없는 파일이에요', 'PDF, Word, 텍스트 파일만 올릴 수 있어요.')
    return false
  }
  if ((asset.size ?? 0) > MAX_BYTES) {
    Alert.alert(SIZE_LIMIT.title, SIZE_LIMIT.body)
    return false
  }
  attachDraftFile(target, { uri: asset.uri, name: asset.name, mimeType: asset.mimeType, size: asset.size })
  return true
}
