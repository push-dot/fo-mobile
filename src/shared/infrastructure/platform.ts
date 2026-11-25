import * as Clipboard from 'expo-clipboard'
import * as DocumentPicker from 'expo-document-picker'
import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import * as ExpoLinking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { Linking, Platform, Share } from 'react-native'
import { OPENABLE_URL, WEB_URL } from './constants'

export const openBrowser = async (url: string) => {
  if (WEB_URL.test(url)) await WebBrowser.openBrowserAsync(url)
}

export const openAuthSession = (url: string, redirectUri: string) =>
  WebBrowser.openAuthSessionAsync(url, redirectUri)

let stubbedDocument: DocumentPicker.DocumentPickerAsset[] | null = null

export const stubPickDocument = (assets: DocumentPicker.DocumentPickerAsset[]) => {
  stubbedDocument = assets
}

export const pickDocument = (options: DocumentPicker.DocumentPickerOptions): Promise<DocumentPicker.DocumentPickerResult> => {
  const assets = stubbedDocument
  stubbedDocument = null
  return assets ? Promise.resolve({ canceled: false, assets }) : DocumentPicker.getDocumentAsync(options)
}

let mockUploadFails = false
export const failMockUploads = (on: boolean) => {
  mockUploadFails = on
}
export const mockUploadFailing = () => mockUploadFails

let mockUploadAt: number | undefined
export const holdMockUpload = (fraction: number | undefined) => {
  mockUploadAt = fraction
}
export const mockUploadHeldAt = () => mockUploadAt

let mockFitHeld = false
export const holdMockFit = (on: boolean) => {
  mockFitHeld = on
}
export const mockFitHolding = () => mockFitHeld

let mockFitSoon = false
export const setMockFitSoon = (on: boolean) => {
  mockFitSoon = on
}
export const mockFitSoonOn = () => mockFitSoon

let mockWebPlan: 'FREE' | 'ULTRA' | undefined
export const setMockWebPlan = (plan: 'FREE' | 'ULTRA' | undefined) => {
  mockWebPlan = plan
}
export const mockWebPlanOf = () => mockWebPlan

let mockFitThree = false
export const setMockFitThree = (on: boolean) => {
  mockFitThree = on
}
export const mockFitThreeOn = () => mockFitThree

let mockAppleFails = false
export const failMockApple = (on: boolean) => {
  mockAppleFails = on
}
export const mockAppleFailing = () => mockAppleFails

let stubbedPick: ImagePicker.ImagePickerAsset[] | null = null

export const stubPickImage = (assets: ImagePicker.ImagePickerAsset[]) => {
  stubbedPick = assets
}

export const pickImage = (options: ImagePicker.ImagePickerOptions): Promise<ImagePicker.ImagePickerResult> => {
  const assets = stubbedPick
  stubbedPick = null
  return assets ? Promise.resolve({ canceled: false, assets }) : ImagePicker.launchImageLibraryAsync(options)
}

export const hapticImpactLight = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

export const hapticNotify = (kind: 'success' | 'warning') =>
  Haptics.notificationAsync(
    kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
  )

export const shareMessage = (content: Parameters<typeof Share.share>[0]) => Share.share(content)

export const openUrl = async (url: string) => {
  if (OPENABLE_URL.test(url)) await Linking.openURL(url)
}

export const copyText = (text: string) => Clipboard.setStringAsync(text)

export const readClipboard = async () => {
  if (Platform.OS === 'web') {
    const clip = globalThis.navigator?.clipboard
    if (!clip?.readText) return ''
    return clip.readText()
  }
  return Clipboard.getStringAsync()
}

export const openSystemSettings = () => ExpoLinking.openSettings()
