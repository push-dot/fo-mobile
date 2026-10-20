import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect'
import { useEffect, useState, type ReactNode } from 'react'
import { AccessibilityInfo, Platform, View, type StyleProp, type ViewStyle } from 'react-native'
import { useColors, useShadow } from '../theme'

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

type Props = {
  children?: ReactNode
  style?: StyleProp<ViewStyle>
  /** 'glass' for buttons, chips, composer; 'sheet' for sheets, menus, approval panels. */
  surface?: 'glass' | 'sheet'
  interactive?: boolean
}

/**
 * iOS 26 Liquid Glass with fallbacks: reduced transparency or older iOS → translucent fill,
 * Android → flat bg2 (design: Android draws the same parts flat).
 */
export function Glass({ children, style, surface = 'glass', interactive }: Props) {
  const c = useColors()
  const s = useShadow()
  const reduce = useReduceTransparency()
  if (Platform.OS === 'android') return <View style={[{ backgroundColor: c.bg2 }, style]}>{children}</View>
  if (glassAvailable && !reduce) {
    return (
      <GlassView style={[s.glass, style]} glassEffectStyle="regular" isInteractive={interactive}>
        {children}
      </GlassView>
    )
  }
  return <View style={[s.glass, { backgroundColor: reduce ? c.bg2 : c[surface] }, style]}>{children}</View>
}
