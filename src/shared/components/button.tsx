import type { StyleProp, ViewStyle } from 'react-native'
import type { IconName } from '@push/design-system'
import { onAccent, platformTheme, spacing, type, useColors, type Colors, type TypeName } from '../../theme'
import { PENDING_OPACITY } from './constants'
import GlassPressable from './glass-pressable'
import Icon from './icon'
import Text from './text'

type Size = 'lg' | 'md' | 'pill' | 'sm'
type Variant = 'primary' | 'secondary' | 'danger'

type Props = {
  label: string
  onPress?: () => void
  variant?: Variant
  size?: Size
  icon?: IconName
  /** Boards size the glyph per screen; defaults to the size's own. */
  iconSize?: number
  /** Horizontal padding when a board sets its own (the size's default otherwise). */
  paddingX?: number
  weight?: '600' | '700'
  disabled?: boolean
  /** The action is running or done: the button is disabled, dimmed like the boards' 지원하는 중… / 지원 완료. */
  pending?: boolean
  /** A button in the header bar is glass; every other button is plain. */
  glass?: boolean
  style?: StyleProp<ViewStyle>
}

const SIZES: Record<Size, { minHeight: number; borderRadius: number; paddingHorizontal: number; text: TypeName; fontSize: number; icon: number }> = {
  lg: { minHeight: 56, borderRadius: platformTheme.buttonRadius, paddingHorizontal: spacing[5], text: 'button', fontSize: type.button.fontSize, icon: 18 },
  md: { minHeight: 48, borderRadius: platformTheme.buttonRadius, paddingHorizontal: spacing[5], text: 'b2', fontSize: type.b2.fontSize, icon: 16 },
  pill: { minHeight: 44, borderRadius: 22, paddingHorizontal: spacing[5], text: 'c1', fontSize: 14, icon: 16 },
  sm: { minHeight: 40, borderRadius: platformTheme.buttonSmRadius, paddingHorizontal: 14, text: 'c1', fontSize: 14, icon: 16 },
}

const VARIANTS: Record<Variant, { glass: boolean; fill: keyof Colors; pressedFill?: keyof Colors; ink: 'accent' | 't1' }> = {
  primary: { glass: false, fill: 'ac', pressedFill: 'acPress', ink: 'accent' },
  // A sub button inside a screen is a plain fill, never glass: glass is for the header and navigation buttons only.
  secondary: { glass: false, fill: 'fill', ink: 't1' },
  danger: { glass: false, fill: 'red', ink: 'accent' },
}

const Button = ({ label, onPress, variant = 'primary', size = 'lg', icon, iconSize, paddingX, weight, disabled, pending, glass, style }: Props) => {
  const c = useColors()
  const s = SIZES[size]
  const v = VARIANTS[variant]
  const fg = v.ink === 'accent' ? onAccent : c.t1
  return (
    <GlassPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || pending }}
      disabled={disabled || pending}
      dimOpacity={pending ? PENDING_OPACITY : undefined}
      onPress={onPress}
      glass={glass ?? v.glass}
      fill={v.fill}
      pressedFill={v.pressedFill}
      style={[{ minHeight: s.minHeight, borderRadius: s.borderRadius }, style]}
      contentStyle={{ paddingHorizontal: paddingX ?? s.paddingHorizontal, paddingVertical: spacing[2], gap: 6 }}
    >
      {icon ? <Icon name={icon} size={iconSize ?? s.icon} color={fg} /> : null}
      <Text v={s.text} weight={weight ?? '700'} style={{ color: fg, fontSize: s.fontSize }}>
        {label}
      </Text>
    </GlassPressable>
  )
}

export default Button
