import { SegmentedButton, SingleChoiceSegmentedButtonRow, Text } from '@expo/ui/jetpack-compose'
import { fillMaxWidth, height, weight } from '@expo/ui/jetpack-compose/modifiers'
import { fontFor, type, useColors, useThemeMode } from '../../theme'
import NativeHost from './native-host'
import { COMPACT_HEIGHT, COMPACT_WIDTH } from './segmented-control.compact'

export type SegmentedControlProps<K extends string> = {
  items: { key: K; label: string }[]
  value: K | null
  onChange: (k: K) => void
  /** The 196 x 34 control Settings draws for the theme row (same on iOS and Android); the default is the 44pt full-width one. */
  compact?: boolean
}

/** Android: Material 3 single-choice segmented buttons. */
const SegmentedControl = <K extends string,>({ items, value, onChange, compact }: SegmentedControlProps<K>) => {
  const c = useColors()
  const dark = useThemeMode() === 'dark'
  return (
    <NativeHost matchContents={{ vertical: true }} style={compact ? { width: COMPACT_WIDTH } : undefined}>
      <SingleChoiceSegmentedButtonRow modifiers={compact ? [fillMaxWidth(), height(COMPACT_HEIGHT)] : [fillMaxWidth()]}>
        {items.map((it) => (
          <SegmentedButton
            key={it.key}
            selected={it.key === value}
            onClick={() => onChange(it.key)}
            colors={{
              activeContainerColor: dark ? c.fill2 : c.bg,
              activeContentColor: c.t1,
              activeBorderColor: c.fill,
              inactiveContainerColor: c.fill,
              inactiveContentColor: c.t3,
              inactiveBorderColor: c.fill,
            }}
            modifiers={[weight(1)]}
          >
            <SegmentedButton.Label>
              <Text style={{ ...fontFor(type.segLabel.weight), fontSize: type.segLabel.fontSize }}>{it.label}</Text>
            </SegmentedButton.Label>
          </SegmentedButton>
        ))}
      </SingleChoiceSegmentedButtonRow>
    </NativeHost>
  )
}

export default SegmentedControl
