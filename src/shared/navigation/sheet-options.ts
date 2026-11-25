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
    sheetCornerRadius: android ? radius.sheetTop : undefined,
    contentStyle: { backgroundColor: android ? c.bg : 'transparent' },
  }
}

export const tintedSheetOptions = (c: Colors, detents?: SheetDetents): NativeStackNavigationOptions => {
  const o = sheetOptions(c, detents)
  return Platform.OS === 'android' ? o : { ...o, contentStyle: { backgroundColor: c.sheet } }
}

export const fullSheetOptions = (c: Colors): NativeStackNavigationOptions => ({ ...sheetOptions(c, [1]), contentStyle: { backgroundColor: c.bg } })

export const modalOptions = (c: Colors): NativeStackNavigationOptions => (Platform.OS === 'android' ? fullSheetOptions(c) : { presentation: 'modal' })

export const fullPageOptions = (): NativeStackNavigationOptions => (Platform.OS === 'ios' ? { presentation: 'fullScreenModal' } : {})
