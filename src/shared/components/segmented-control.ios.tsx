import { Picker, Text } from '@expo/ui/swift-ui'
import { controlSize, pickerStyle, tag } from '@expo/ui/swift-ui/modifiers'
import { setSegmentedTitleFont } from '../../../modules/segmented-appearance'
import { NATIVE_FONTS } from '../../theme/fonts'
import { type } from '../../theme'
import type { SegmentedControlProps } from './segmented-control.android'
import { COMPACT_WIDTH } from './segmented-control.compact'
import NativeHost from './native-host'

// The SwiftUI picker ignores a font modifier on its labels; UIAppearance reaches the UISegmentedControl behind it.
setSegmentedTitleFont(NATIVE_FONTS[type.segLabel.weight], type.segLabel.fontSize)

/** iOS: SwiftUI segmented picker (UISegmentedControl). */
const SegmentedControl = <K extends string,>({ items, value, onChange, compact }: SegmentedControlProps<K>) => (
  <NativeHost matchContents={{ vertical: true }} style={compact ? { width: COMPACT_WIDTH } : undefined}>
    <Picker
      selection={value}
      onSelectionChange={(k) => k !== null && onChange(k)}
      modifiers={[pickerStyle('segmented'), controlSize(compact ? 'regular' : 'large')]}
    >
      {items.map((it) => (
        <Text key={it.key} modifiers={[tag(it.key)]}>
          {it.label}
        </Text>
      ))}
    </Picker>
  </NativeHost>
)

export default SegmentedControl
