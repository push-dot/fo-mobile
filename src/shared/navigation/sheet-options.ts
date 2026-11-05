import type { NativeStackNavigationOptions } from 'expo-router'
import { Platform } from 'react-native'
import { radius, type Colors } from '../../theme'

export type SheetDetents = NativeStackNavigationOptions['sheetAllowedDetents']

export const sheetOptions = (c: Colors, detents: SheetDetents = 'fitToContents'): NativeStackNavigationOptions => {
  const android = Platform.OS === 'android'
  return {
    presentation: 'formSheet',
    headerShown: false,
    sheetAllowedDetents: detents,
    sheetGrabberVisible: true,
    sheetCornerRadius: android ? radius.xl : undefined,
    contentStyle: { backgroundColor: android ? c.bg : 'transparent' },
  }
}
