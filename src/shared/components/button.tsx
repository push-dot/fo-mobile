import type { StyleProp, ViewStyle } from 'react-native'
import type { IconName } from '@push/design-system'
import { onAccent, platformTheme, spacing, type, useColors, type Colors, type TypeName } from '../../theme'
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
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

const SIZES: Record<Size, { minHeight: number; borderRadius: number; paddingHorizontal: number; text: TypeName; fontSize: number }> = {
  lg: { minHeight: 56, borderRadius: platformTheme.buttonRadius, paddingHorizontal: spacing[5], text: 'button', fontSize: type.button.fontSize },
  md: { minHeight: 48, borderRadius: platformTheme.buttonRadius, paddingHorizontal: spacing[5], text: 'b2', fontSize: type.b2.fontSize },
  pill: { minHeight: 44, borderRadius: 22, paddingHorizontal: spacing[5], text: 'c1', fontSize: 14 },
  sm: { minHeight: 40, borderRadius: platformTheme.buttonSmRadius, paddingHorizontal: 14, text: 'c1', fontSize: 14 },
}

const VARIANTS: Record<Variant, { glass: boolean; fill: keyof Colors; pressedFill?: keyof Colors; ink: 'accent' | 't1' }> = {
  primary: { glass: false, fill: 'ac', pressedFill: 'acPress', ink: 'accent' },
  secondary: { glass: true, fill: 'fill', ink: 't1' },
  danger: { glass: false, fill: 'red', ink: 'accent' },
}

const Button = ({ label, onPress, variant = 'primary', size = 'lg', icon, disabled, style }: Props) => {
  const c = useColors()
  const s = SIZES[size]
  const v = VARIANTS[variant]
  const fg = v.ink === 'accent' ? onAccent : c.t1
  return (
    <GlassPressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      glass={v.glass}
      fill={v.fill}
      pressedFill={v.pressedFill}
      style={[{ minHeight: s.minHeight, borderRadius: s.borderRadius }, style]}
      contentStyle={{ paddingHorizontal: s.paddingHorizontal, paddingVertical: spacing[2], gap: 6 }}
    >
      {icon ? <Icon name={icon} size={16} color={fg} /> : null}
      <Text v={s.text} weight="700" style={{ color: fg, fontSize: s.fontSize }}>
        {label}
      </Text>
    </GlassPressable>
  )
}

export default Button
