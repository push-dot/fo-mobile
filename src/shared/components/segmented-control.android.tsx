import { Pressable, View } from 'react-native'
import { cssShadow, spacing, useColors, useThemeMode } from '../../theme'
import { COMPACT_HEIGHT, COMPACT_WIDTH } from './segmented-control.compact'
import Text from './text'

export type SegmentedControlProps<K extends string> = {
  items: { key: K; label: string }[]
  value: K | null
  onChange: (k: K) => void
  /** The 196 x 34 control Settings draws for the theme row (same on iOS and Android); the default is the 44pt full-width one. */
  compact?: boolean
}

const INSET = spacing[1]

// The boards draw the full-width control as a tab list and Settings' compact theme picker as a radio group.
const VARIANT = {
  regular: { height: 44, width: undefined, group: 'tablist', item: 'tab', state: (on: boolean) => ({ selected: on }) },
  compact: { height: COMPACT_HEIGHT, width: COMPACT_WIDTH, group: 'radiogroup', item: 'radio', state: (on: boolean) => ({ checked: on }) },
} as const

/**
 * Android: the boards' `.seg`, a flat `fill` pill track with a raised `bg` (dark: `fill2`) selected segment.
 * Material 3 segmented buttons draw square middle cells, a border per cell and a check icon, none of which the boards have.
 */
const SegmentedControl = <K extends string,>({ items, value, onChange, compact }: SegmentedControlProps<K>) => {
  const c = useColors()
  const dark = useThemeMode() === 'dark'
  const variant = VARIANT[compact ? 'compact' : 'regular']
  const segment = variant.height - 2 * INSET
  return (
    <View
      accessibilityRole={variant.group}
      style={{ height: variant.height, width: variant.width, borderRadius: variant.height / 2, backgroundColor: c.fill, flexDirection: 'row', padding: INSET }}
    >
      {items.map((it) => {
        const on = it.key === value
        return (
          <Pressable
            key={it.key}
            accessibilityRole={variant.item}
            accessibilityState={variant.state(on)}
            hitSlop={{ top: INSET, bottom: INSET }}
            onPress={() => onChange(it.key)}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: segment / 2,
              backgroundColor: on ? (dark ? c.fill2 : c.bg) : undefined,
              boxShadow: on ? cssShadow.segment : undefined,
            }}
          >
            <Text v="segLabel" color={on ? 't1' : 't3'} numberOfLines={1}>
              {it.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export default SegmentedControl
