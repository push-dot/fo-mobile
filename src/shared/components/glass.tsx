import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect'
import { useEffect, useState, type ReactNode } from 'react'
import { AccessibilityInfo, Platform, View, type StyleProp, type ViewStyle } from 'react-native'
import { useColors, useShadow } from '../../theme'

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
  surface?: 'glass' | 'sheet'
  interactive?: boolean
}

const Glass = ({ children, style, surface = 'glass', interactive }: Props) => {
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

export default Glass
