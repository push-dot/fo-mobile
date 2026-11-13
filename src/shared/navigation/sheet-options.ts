import type { NativeStackNavigationOptions } from 'expo-router'
import { Platform } from 'react-native'
import { radius, type Colors } from '../../theme'

export type SheetDetents = NativeStackNavigationOptions['sheetAllowedDetents']

// iOS 26 floats partial-detent sheets inset with concentric corners; keep the system corner.
export const sheetOptions = (c: Colors, detents: SheetDetents = 'fitToContents'): NativeStackNavigationOptions => {
  const android = Platform.OS === 'android'
  return {
    presentation: 'formSheet',
    headerShown: false,
    sheetAllowedDetents: detents,
    sheetGrabberVisible: true,
    sheetCornerRadius: android ? radius.sheetTop : undefined,
    contentStyle: { backgroundColor: android ? c.bg : 'transparent' },
  }
}

/** A sheet drawn to the top of the screen: iOS attaches it 10pt under the status bar, opaque; Android right under it. */
export const fullSheetOptions = (c: Colors): NativeStackNavigationOptions => ({ ...sheetOptions(c, [1]), contentStyle: { backgroundColor: c.bg } })

/** A full-screen modal: iOS keeps the system `modal`; Android's `modal` is a plain full-screen slide, so it takes the boards' full sheet (radius 28, the screen behind shows above it). */
export const modalOptions = (c: Colors): NativeStackNavigationOptions => (Platform.OS === 'android' ? fullSheetOptions(c) : { presentation: 'modal' })
