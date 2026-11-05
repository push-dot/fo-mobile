import { SegmentedButton, SingleChoiceSegmentedButtonRow, Text } from '@expo/ui/jetpack-compose'
import { fillMaxWidth, weight } from '@expo/ui/jetpack-compose/modifiers'
import { useColors } from '../../theme'
import NativeHost from './native-host'

export type SegmentedControlProps<K extends string> = {
  items: { key: K; label: string }[]
  value: K | null
  onChange: (k: K) => void
}

/** Android: Material 3 single-choice segmented buttons. */
const SegmentedControl = <K extends string,>({ items, value, onChange }: SegmentedControlProps<K>) => {
  const c = useColors()
  return (
    <NativeHost matchContents={{ vertical: true }}>
      <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth()]}>
        {items.map((it) => (
          <SegmentedButton
            key={it.key}
            selected={it.key === value}
            onClick={() => onChange(it.key)}
            colors={{
              activeContainerColor: c.acSoft,
              activeContentColor: c.acText,
              activeBorderColor: c.t4,
              inactiveContainerColor: c.bg,
              inactiveContentColor: c.t2,
              inactiveBorderColor: c.t4,
            }}
            modifiers={[weight(1)]}
          >
            <SegmentedButton.Label>
              <Text>{it.label}</Text>
            </SegmentedButton.Label>
          </SegmentedButton>
        ))}
      </SingleChoiceSegmentedButtonRow>
    </NativeHost>
  )
}

export default SegmentedControl
