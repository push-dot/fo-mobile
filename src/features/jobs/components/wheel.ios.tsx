import { Picker, Text as SwiftText } from '@expo/ui/swift-ui'
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers'
import NativeHost from '../../../shared/components/native-host'
import { WHEEL_HEIGHT, type WheelProps } from './wheel-types'

/** The iOS wheel (UIPickerView), not a drawing of one. */
const Wheel = ({ options, value, onChange, label }: WheelProps) => (
  <NativeHost style={{ flex: 1, height: WHEEL_HEIGHT }}>
    <Picker label={label} selection={value} onSelectionChange={onChange} modifiers={[pickerStyle('wheel')]}>
      {options.map((o) => (
        <SwiftText key={o.value} modifiers={[tag(o.value)]}>
          {o.label}
        </SwiftText>
      ))}
    </Picker>
  </NativeHost>
)

export default Wheel
