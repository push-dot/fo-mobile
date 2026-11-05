import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect'
import { useEffect, useState, type ReactNode } from 'react'
import { AccessibilityInfo, Platform, View, type StyleProp, type ViewStyle } from 'react-native'
import { useColors, useShadow } from '../../theme'
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

export const useGlassSurface = () => {
  const reduce = useReduceTransparency()
  return glassAvailable && !reduce
}

type Props = {
  children?: ReactNode
  style?: StyleProp<ViewStyle>
  surface?: 'glass' | 'sheet'
  interactive?: boolean
}

const Glass = ({ children, style, surface = 'glass', interactive }: Props) => {
  const c = useColors()
  const boxShadow = toBoxShadow(useShadow().glass)
  const glass = useGlassSurface()
  if (Platform.OS === 'android') return <View style={[{ backgroundColor: c.bg2 }, style]}>{children}</View>
  if (glass) {
    // An RN boxShadow stays at rest size while interactive glass grows on press, leaving a fixed disc inside it.
    return (
      <GlassView style={[interactive ? null : { boxShadow }, style]} glassEffectStyle="regular" isInteractive={interactive}>
        {children}
      </GlassView>
    )
  }
  return <View style={[{ boxShadow, backgroundColor: glassAvailable ? c.bg2 : c[surface] }, style]}>{children}</View>
}

export default Glass
