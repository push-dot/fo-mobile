import * as DocumentPicker from 'expo-document-picker'
import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import * as WebBrowser from 'expo-web-browser'

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
