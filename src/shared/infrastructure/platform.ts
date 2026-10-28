import * as DocumentPicker from 'expo-document-picker'
import { File, Paths } from 'expo-file-system'
import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import * as Sharing from 'expo-sharing'
import * as WebBrowser from 'expo-web-browser'
import { Linking, Share } from 'react-native'

export const openBrowser = (url: string) => WebBrowser.openBrowserAsync(url)

export const openAuthSession = (url: string, redirectUri: string) =>
  WebBrowser.openAuthSessionAsync(url, redirectUri)

export const pickDocument = (
  options: DocumentPicker.DocumentPickerOptions,
) => DocumentPicker.getDocumentAsync(options)

export const pickImage = (options: ImagePicker.ImagePickerOptions) =>
  ImagePicker.launchImageLibraryAsync(options)

export const hapticImpactLight = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

export const hapticNotify = (kind: 'success' | 'warning') =>
  Haptics.notificationAsync(
    kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
  )

export const saveToCache = async (name: string, bytes: Uint8Array) => {
  const file = new File(Paths.cache, name)
  file.create({ overwrite: true })
  await file.write(bytes)
  return file.uri
}

export const shareFile = (uri: string, dialogTitle: string) => Sharing.shareAsync(uri, { dialogTitle })

export const shareMessage = (content: Parameters<typeof Share.share>[0]) => Share.share(content)

export const openUrl = (url: string) => Linking.openURL(url)
