import { Pressable, View } from 'react-native'
import { spacing, useColors, useThemeMode } from '../../theme'
import Glass from './glass'
import type { SegmentedControlProps } from './segmented-control.android'
import { COMPACT_HEIGHT, COMPACT_WIDTH } from './segmented-control.compact'
import Text from './text'

const HEIGHT = 44
const INSET = spacing[1]
const SELECTED_SHADOW = '0 2px 8px rgba(0,0,0,.08)'

/** iOS: the boards' `.ios .seg`, a glass track whose selected segment is filled. UISegmentedControl draws the reverse. */
const SegmentedControl = <K extends string,>({ items, value, onChange, compact }: SegmentedControlProps<K>) => {
  const c = useColors()
  const dark = useThemeMode() === 'dark'
  const height = compact ? COMPACT_HEIGHT : HEIGHT
  const segment = height - 2 * INSET
  return (
    <Glass interactive tint={dark ? c.glass : undefined} style={{ height, width: compact ? COMPACT_WIDTH : undefined, borderRadius: height / 2 }}>
      <View accessibilityRole="tablist" style={{ flex: 1, flexDirection: 'row', padding: INSET }}>
        {items.map((it) => {
          const on = it.key === value
          return (
            <Pressable
              key={it.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              hitSlop={{ top: INSET, bottom: INSET }}
              onPress={() => onChange(it.key)}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: segment / 2,
                backgroundColor: on ? c.fill : undefined,
                boxShadow: on ? SELECTED_SHADOW : undefined,
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
