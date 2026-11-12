import { Pressable, View } from 'react-native'
import { cssShadow, spacing, useColors, useThemeMode } from '../../theme'
import Glass from './glass'
import type { SegmentedControlProps } from './segmented-control.android'
import { COMPACT_HEIGHT, COMPACT_WIDTH } from './segmented-control.compact'
import Text from './text'

const INSET = spacing[1]

// The boards draw the full-width control as a tab list and Settings' compact theme picker as a radio group.
const VARIANT = {
  regular: { height: 44, width: undefined, group: 'tablist', item: 'tab', state: (on: boolean) => ({ selected: on }) },
  compact: { height: COMPACT_HEIGHT, width: COMPACT_WIDTH, group: 'radiogroup', item: 'radio', state: (on: boolean) => ({ checked: on }) },
} as const

/** iOS: the boards' `.ios .seg`, a glass track whose selected segment is filled. UISegmentedControl draws the reverse. */
const SegmentedControl = <K extends string,>({ items, value, onChange, compact }: SegmentedControlProps<K>) => {
  const c = useColors()
  const dark = useThemeMode() === 'dark'
  const variant = VARIANT[compact ? 'compact' : 'regular']
  const segment = variant.height - 2 * INSET
  return (
    <Glass interactive tint={dark ? c.glass : undefined} style={{ height: variant.height, width: variant.width, borderRadius: variant.height / 2 }}>
      <View accessibilityRole={variant.group} style={{ flex: 1, flexDirection: 'row', padding: INSET }}>
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
                backgroundColor: on ? c.fill : undefined,
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
    </Glass>
  )
}

export default SegmentedControl
