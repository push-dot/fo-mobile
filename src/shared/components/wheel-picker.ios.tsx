import { Picker, Text as SwiftText } from '@expo/ui/swift-ui'
import { StyleSheet } from 'react-native-unistyles'
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers'
import NativeHost from './native-host'
import type { WheelPickerProps } from './wheel-picker.android'
import { WHEEL_HEIGHT } from './wheel-picker.android'

export type { WheelPickerProps }

const WheelPicker = ({ items, value, onChange, accessibilityLabel, columns, short }: WheelPickerProps) => (
  <NativeHost style={[styles.host(columns ? WHEEL_HEIGHT.columns : short ? WHEEL_HEIGHT.short : WHEEL_HEIGHT.full), columns && styles.columns]}>
    <Picker label={accessibilityLabel} selection={value} onSelectionChange={onChange} modifiers={[pickerStyle('wheel')]}>
      {items.map((it) => (
        <SwiftText key={it.key} modifiers={[tag(it.key)]}>
          {it.label}
        </SwiftText>
      ))}
    </Picker>
  </NativeHost>
)

const styles = StyleSheet.create(() => ({
  host: (height: number) => ({ height }),
  columns: { flex: 1 },
}))

export default WheelPicker
