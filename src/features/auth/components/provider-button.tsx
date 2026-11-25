import { Pressable, View } from 'react-native'
import { SvgXml } from 'react-native-svg'
import { Text } from '../../../shared/components'
import { StyleSheet } from 'react-native-unistyles'

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
    style={({ pressed }) => styles.press(disabled, pressed)}
  >
    <View style={styles.button(bg, border)}>
      <SvgXml xml={logo} width={20} height={20} color={fg} />
      <Text v="h3" style={styles.label(fg)}>
        {label}
      </Text>
    </View>
  </Pressable>
)

const styles = StyleSheet.create((theme) => ({
  press: (disabled: boolean, pressed: boolean) => ({ opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }),
  button: (bg: string, border?: string) => ({
    height: 56,
    borderRadius: theme.platform.buttonRadius,
    backgroundColor: bg,
    borderWidth: border ? 1 : 0,
    borderColor: border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 96,
    gap: 10,
  }),
  label: (fg: string) => ({ color: fg }),
}))

export default ProviderButton
