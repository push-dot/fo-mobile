import type { ReactNode } from 'react'
import { Platform, Pressable, View, type StyleProp, type ViewStyle } from 'react-native'
import { radius, useColors } from '../../theme'
import Glass from './glass'
import Icon from './icon'
import type { IconName } from './icon-data'
import Text from './text'

type Props = {
  label: string
  onPress?: () => void
  variant?: 'primary' | 'secondary'
  size?: 'lg' | 'sm'
  icon?: IconName
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

const Button = ({ label, onPress, variant = 'primary', size = 'lg', icon, disabled, style }: Props) => {
  const c = useColors()
  const sm = size === 'sm'
  const fg = variant === 'primary' ? '#FFFFFF' : c.t1
  const box: ViewStyle = {
    height: sm ? 40 : 56,
    borderRadius: sm ? radius.sm : radius.md,
    paddingHorizontal: sm ? 14 : 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  }
  const content: ReactNode = (
    <>
      {icon ? <Icon name={icon} size={16} color={fg} /> : null}
      <Text v={sm ? 'c1' : 'h3'} weight="700" style={{ color: fg, fontSize: sm ? 14 : 17 }}>
        {label}
      </Text>
    </>
  )
  const glassSecondary = variant === 'secondary' && Platform.OS === 'ios'
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [{ opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }, style]}
    >
      {glassSecondary ? (
        <Glass interactive style={box}>
          {content}
        </Glass>
      ) : (
        <View style={[box, { backgroundColor: variant === 'primary' ? c.ac : c.fill }]}>
          {content}
        </View>
      )}
    </Pressable>
  )
}

export default Button
