import { Picker, Text } from '@expo/ui/swift-ui'
import { controlSize, pickerStyle, tag, tint } from '@expo/ui/swift-ui/modifiers'
import { useColors } from '../../theme'
import type { SegmentedControlProps } from './segmented-control.android'
import NativeHost from './native-host'

/** iOS: SwiftUI segmented picker (UISegmentedControl). */
const SegmentedControl = <K extends string,>({ items, value, onChange }: SegmentedControlProps<K>) => {
  const c = useColors()
  return (
  <NativeHost matchContents={{ vertical: true }}>
    <Picker
      selection={value}
      onSelectionChange={(k) => k !== null && onChange(k)}
      modifiers={[pickerStyle('segmented'), controlSize('large'), tint(c.ac)]}
    >
      {items.map((it) => (
        <Text key={it.key} modifiers={[tag(it.key)]}>
          {it.label}
        </Text>
      ))}
    </Picker>
  </NativeHost>
  )
}

export default SegmentedControl
