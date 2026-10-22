import { Pressable, View } from 'react-native'
import { SvgXml } from 'react-native-svg'
import { Text } from '../../../shared/components'
import { radius } from '../../../theme'

const ProviderButton = ({
  label,
  logo,
  bg,
  fg,
  border,
  disabled,
  onPress,
}: {
  label: string
  logo: string
  bg: string
  fg: string
  border?: string
  disabled: boolean
  onPress: () => void
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ disabled }}
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => ({ opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}
  >
    <View
      style={{ height: 56, borderRadius: radius.md, backgroundColor: bg, borderWidth: border ? 1 : 0, borderColor: border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
    >
      <SvgXml xml={logo} width={20} height={20} />
      <Text v="h3" weight="700" style={{ color: fg, fontSize: 17 }}>
        {label}
      </Text>
    </View>
  </Pressable>
)

export default ProviderButton
