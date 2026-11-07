import type { ReactNode } from 'react'
import { Pressable, View, type ColorValue, type PressableProps, type StyleProp, type ViewStyle } from 'react-native'
import { useColors, type Colors } from '../../theme'
import { DISABLED_OPACITY, PRESS_SCALE } from './constants'
import Glass, { useGlassSurface } from './glass'

type Props = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  contentStyle?: StyleProp<ViewStyle>
  glass?: boolean
  tint?: ColorValue
  fill?: keyof Colors | null
  pressedFill?: keyof Colors
}

const CONTENT: ViewStyle = { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }

// iOS glass answers presses natively (isInteractive); a JS scale around it would move the shape apart from its glass.
const GlassPressable = ({ children, style, contentStyle, glass = true, tint, fill = 'fill', pressedFill, disabled, ...press }: Props) => {
  const c = useColors()
  const native = useGlassSurface() && glass
  const dim = disabled ? { opacity: DISABLED_OPACITY } : null
  if (native) {
    return (
      <Glass interactive tint={tint} style={style}>
        <Pressable {...press} disabled={disabled} style={[CONTENT, { flexGrow: 1 }, contentStyle, dim]}>
          {children}
        </Pressable>
      </Glass>
    )
  }
  return (
    <Pressable
      {...press}
      disabled={disabled}
      android_ripple={{ color: c[pressedFill ?? 'fill2'], foreground: true }}
      style={({ pressed }) => [
        {
          overflow: 'hidden',
          backgroundColor: fill ? c[pressed && pressedFill ? pressedFill : fill] : undefined,
          transform: [{ scale: pressed ? PRESS_SCALE : 1 }],
        },
        style,
        dim,
      ]}
    >
      <View style={[CONTENT, { flexGrow: 1 }, contentStyle]}>{children}</View>
    </Pressable>
  )
}

export default GlassPressable
