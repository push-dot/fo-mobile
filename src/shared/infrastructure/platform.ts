import * as Clipboard from 'expo-clipboard'
import * as DocumentPicker from 'expo-document-picker'
import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import * as ExpoLinking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { Linking, Platform, Share } from 'react-native'

export const openBrowser = (url: string) => WebBrowser.openBrowserAsync(url)

export const openAuthSession = (url: string, redirectUri: string) =>
  WebBrowser.openAuthSessionAsync(url, redirectUri)

let stubbedDocument: DocumentPicker.DocumentPickerAsset[] | null = null

/** Mock tours (`mock=upload-fail`): the next pickDocument returns these assets instead of opening the system file picker, which a tour cannot drive. */
export const stubPickDocument = (assets: DocumentPicker.DocumentPickerAsset[]) => {
  stubbedDocument = assets
}

export const pickDocument = (options: DocumentPicker.DocumentPickerOptions): Promise<DocumentPicker.DocumentPickerResult> => {
  const assets = stubbedDocument
  stubbedDocument = null
  return assets ? Promise.resolve({ canceled: false, assets }) : DocumentPicker.getDocumentAsync(options)
}

/** Mock tours (`mock=upload-fail`): the mock API skips the upload, so this makes it fail the way a dropped connection does (ChatErrUpload). */
let mockUploadFails = false
export const failMockUploads = (on: boolean) => {
  mockUploadFails = on
}
export const mockUploadFailing = () => mockUploadFails

/** Mock tours (`mock=fit-comparing`): fo-web's WebView mock answers the fit at once, so JobFit's 비교하는 중 card is never on screen. The WebView is told to wait. */
let mockFitHeld = false
export const holdMockFit = (on: boolean) => {
  mockFitHeld = on
}
export const mockFitHolding = () => mockFitHeld

/** Mock tours (`mock=fit-soon`): the WebView mock always answers a finished fit, so JobDetailStates' 적합도는 곧 볼 수 있어요 card never shows. The fit request is made to fail. */
let mockFitSoon = false
export const setMockFitSoon = (on: boolean) => {
  mockFitSoon = on
}
export const mockFitSoonOn = () => mockFitSoon

/** Mock tours (`mock=plan-free`, `plan-ultra`): the WebView mock cannot read the account, so the job page's fit card is told the plan (PRO when none is set): FREE draws the locked card, ULTRA the `이렇게 고치면 N점대` row. */
let mockWebPlan: 'FREE' | 'ULTRA' | undefined
export const setMockWebPlan = (plan: 'FREE' | 'ULTRA' | undefined) => {
  mockWebPlan = plan
}
export const mockWebPlanOf = () => mockWebPlan

/** Mock tours (`mock=apple-fail`): the Apple sign-in sheet cannot be driven or made to fail in a tour, so the attempt reports a failure instead of opening it (SignInErrors.4). */
let mockAppleFails = false
export const failMockApple = (on: boolean) => {
  mockAppleFails = on
}
export const mockAppleFailing = () => mockAppleFails

let stubbedPick: ImagePicker.ImagePickerAsset[] | null = null

/** Mock tours (`mock=two-photos`): the next pickImage returns these assets instead of opening the system picker, whose labels the app does not set. */
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

export const openUrl = (url: string) => Linking.openURL(url)

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
