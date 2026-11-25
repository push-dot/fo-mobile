import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect'
import { useContext, useEffect, useState, type ReactNode } from 'react'
import { AccessibilityInfo, Platform, View, type ColorValue, type StyleProp, type ViewStyle } from 'react-native'
import { useColors, useShadow, useThemeMode, type Colors } from '../../theme'
import { toBoxShadow } from '../utility'
import { SheetSurface } from './sheet-surface'

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

export const useGlassSurface = () => {
  const reduce = useReduceTransparency()
  const inSheet = useContext(SheetSurface)
  return glassAvailable && !reduce && !inSheet
}

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
    return (
      <GlassView style={[interactive ? null : { boxShadow }, style]} glassEffectStyle="regular" tintColor={tint} isInteractive={interactive}>
        {children}
      </GlassView>
    )
  }
  return <View style={[{ boxShadow, backgroundColor: sheetFill ?? (glassAvailable ? c.bg2 : c[surface]) }, style]}>{children}</View>
}

export default Glass
