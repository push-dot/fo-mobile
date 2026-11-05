import type { ReactNode } from 'react'
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native'
import { useColors, type Colors } from '../../theme'
import { DISABLED_OPACITY, PRESS_SCALE } from './constants'
import Glass, { useGlassSurface } from './glass'

type Props = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  contentStyle?: StyleProp<ViewStyle>
  glass?: boolean
  fill?: keyof Colors | null
  pressedFill?: keyof Colors
}

const CONTENT: ViewStyle = { flexGrow: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }

// iOS glass answers presses natively (isInteractive); a JS scale around it would move the shape apart from its glass.
const GlassPressable = ({ children, style, contentStyle, glass = true, fill = 'fill', pressedFill, disabled, ...press }: Props) => {
  const c = useColors()
  const native = useGlassSurface() && glass
  const dim = disabled ? { opacity: DISABLED_OPACITY } : null
  if (native) {
    return (
      <Glass interactive style={style}>
        <Pressable {...press} disabled={disabled} style={[CONTENT, contentStyle, dim]}>
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
        CONTENT,
        {
          overflow: 'hidden',
          backgroundColor: fill ? c[pressed && pressedFill ? pressedFill : fill] : undefined,
          transform: [{ scale: pressed ? PRESS_SCALE : 1 }],
        },
        style,
        contentStyle,
        dim,
      ]}
    >
      {children}
    </Pressable>
  )
}

export default GlassPressable
