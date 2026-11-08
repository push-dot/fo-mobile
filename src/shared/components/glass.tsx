import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { AccessibilityInfo, Platform, View, type ColorValue, type StyleProp, type ViewStyle } from 'react-native'
import { useColors, useShadow, useThemeMode, type Colors } from '../../theme'
import { toBoxShadow } from '../utility'

const glassAvailable = Platform.OS === 'ios' && isGlassEffectAPIAvailable()

export const useReduceTransparency = () => {
  const [on, setOn] = useState(false)
  useEffect(() => {
    void AccessibilityInfo.isReduceTransparencyEnabled().then(setOn)
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setOn)
    return () => sub.remove()
  }, [])
  return on
}

/** Native glass inside a glass sheet draws nothing, so a glass control in a partial iOS sheet draws the board's glass colour instead. */
export const SheetSurface = createContext(false)

export const useGlassSurface = () => {
  const reduce = useReduceTransparency()
  const inSheet = useContext(SheetSurface)
  return glassAvailable && !reduce && !inSheet
}

/**
 * The board's `--glass` laid over a sheet, null outside an iOS sheet. Light `--glass` is 60% white over the board's light `--sheet`,
 * which reads as solid white on the boards, while the same rgba over the native sheet material reads grey, so light paints `bg`.
 */
export const sheetGlassFill = (inSheet: boolean, dark: boolean, c: Pick<Colors, 'bg' | 'glass'>) => (inSheet ? (dark ? c.glass : c.bg) : null)

export const useSheetGlassFill = () => sheetGlassFill(useContext(SheetSurface), useThemeMode() === 'dark', useColors())

type Props = {
  children?: ReactNode
  style?: StyleProp<ViewStyle>
  surface?: 'glass' | 'sheet'
  interactive?: boolean
  tint?: ColorValue
}

const Glass = ({ children, style, surface = 'glass', interactive, tint }: Props) => {
  const c = useColors()
  const boxShadow = toBoxShadow(useShadow().glass)
  const glass = useGlassSurface()
  const sheetFill = useSheetGlassFill()
  if (Platform.OS === 'android') return <View style={[{ backgroundColor: c.bg2 }, style]}>{children}</View>
  if (glass) {
    // An RN boxShadow stays at rest size while interactive glass grows on press, leaving a fixed disc inside it.
    return (
      <GlassView style={[interactive ? null : { boxShadow }, style]} glassEffectStyle="regular" tintColor={tint} isInteractive={interactive}>
        {children}
      </GlassView>
    )
  }
  return <View style={[{ boxShadow, backgroundColor: sheetFill ?? (glassAvailable ? c.bg2 : c[surface]) }, style]}>{children}</View>
}

export default Glass
