import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { Linking } from 'react-native'
import { http, openBrowser, pickDocument } from '../../../shared/infrastructure'
import { downloadArtifact } from './artifact-download'

export const CHAT_ATTACHMENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
]
export const CHAT_DOC_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export const pickChatAttachment = () =>
  pickDocument({ type: CHAT_ATTACHMENT_TYPES, copyToCacheDirectory: false })

export const pickChatDoc = () =>
  pickDocument({ type: CHAT_DOC_TYPES, copyToCacheDirectory: true })

const saveToCache = async (name: string, bytes: Uint8Array) => {
  const file = new File(Paths.cache, name)
  file.create({ overwrite: true })
  await file.write(bytes)
  return file.uri
}

export const openArtifact = async (downloadUrl: string, name: string) => {
  const uri = await downloadArtifact({ get: (path) => http.raw('GET', path), save: saveToCache }, downloadUrl, name)
  await Sharing.shareAsync(uri, { dialogTitle: name })
}

export const openExternal = (url: string) => openBrowser(url)

export const openLink = (url: string) => Linking.openURL(url)
