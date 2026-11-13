import { Picker, Text as SwiftText } from '@expo/ui/swift-ui'
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers'
import NativeHost from './native-host'
import type { WheelPickerProps } from './wheel-picker.android'

export type { WheelPickerProps }

const WHEEL_HEIGHT = 180

/** The system wheel (UIPickerView look) the boards draw inside the modal; the screen behind shows only the current value. */
const WheelPicker = ({ items, value, onChange, accessibilityLabel }: WheelPickerProps) => (
  <NativeHost style={{ height: WHEEL_HEIGHT }}>
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
