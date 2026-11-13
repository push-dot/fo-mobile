import { Pressable, View } from 'react-native'
import { spacing, useColors } from '../../theme'
import Text from './text'

export type WheelPickerProps = {
  items: readonly { key: string; label: string }[]
  value: string
  onChange: (key: string) => void
  accessibilityLabel: string
}

const RADIO = 20

/** Android has no wheel: the board draws the platform's own single-choice list (radio rows). */
const WheelPicker = ({ items, value, onChange, accessibilityLabel }: WheelPickerProps) => {
  const c = useColors()
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {items.map((it) => {
        const on = it.key === value
        return (
          <Pressable
            key={it.key}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onChange(it.key)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4], minHeight: 52, paddingHorizontal: spacing[1] }}
          >
            <View style={{ width: RADIO, height: RADIO, borderRadius: RADIO / 2, borderWidth: on ? 6 : 2, borderColor: on ? c.ac : c.t3 }} />
            <Text v="b1" style={{ flex: 1 }}>
              {it.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export default WheelPicker
