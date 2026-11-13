import { Picker, Text as SwiftText } from '@expo/ui/swift-ui'
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers'
import NativeHost from './native-host'
import type { WheelPickerProps } from './wheel-picker.android'
import { WHEEL_HEIGHT } from './wheel-picker.android'

export type { WheelPickerProps }

/** The system wheel (UIPickerView), not a drawing of one: a full-width wheel in the settings modal, or one of two side by side (`columns`). */
const WheelPicker = ({ items, value, onChange, accessibilityLabel, columns }: WheelPickerProps) => (
  <NativeHost style={{ height: columns ? WHEEL_HEIGHT.columns : WHEEL_HEIGHT.full, ...(columns ? { flex: 1 } : null) }}>
    <Picker label={accessibilityLabel} selection={value} onSelectionChange={onChange} modifiers={[pickerStyle('wheel')]}>
      {items.map((it) => (
        <SwiftText key={it.key} modifiers={[tag(it.key)]}>
          {it.label}
        </SwiftText>
      ))}
    </Picker>
  </NativeHost>
)

export default WheelPicker
