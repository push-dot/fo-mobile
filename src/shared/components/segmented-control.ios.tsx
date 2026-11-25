import { Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { cssShadow, spacing, useColors, useThemeMode } from '../../theme'
import Glass, { useReduceTransparency } from './glass'
import type { SegmentedControlProps } from './segmented-control.android'
import { COMPACT_HEIGHT, COMPACT_WIDTH, SLIM_HEIGHT } from './segmented-control.compact'
import Text from './text'

const INSET = spacing[1]

const VARIANT = {
  regular: { height: 44, width: undefined, group: 'tablist', item: 'tab', state: (on: boolean) => ({ selected: on }) },
  slim: { height: SLIM_HEIGHT, width: undefined, group: 'tablist', item: 'tab', state: (on: boolean) => ({ selected: on }) },
  compact: { height: COMPACT_HEIGHT, width: COMPACT_WIDTH, group: 'radiogroup', item: 'radio', state: (on: boolean) => ({ checked: on }) },
} as const

const SegmentedControl = <K extends string,>({ items, value, onChange, compact, slim }: SegmentedControlProps<K>) => {
  const c = useColors()
  const dark = useThemeMode() === 'dark'
  const plain = useReduceTransparency()
  const variant = VARIANT[compact ? 'compact' : slim ? 'slim' : 'regular']
  const segment = variant.height - 2 * INSET
  return (
    <Glass
      interactive
      tint={dark ? c.glass : undefined}
      style={[styles.track(variant.height, variant.width), plain && styles.plain]}
    >
      <View accessibilityRole={variant.group} style={styles.row}>
        {items.map((it) => {
          const on = it.key === value
          return (
            <Pressable
              key={it.key}
              accessibilityRole={variant.item}
              accessibilityState={variant.state(on)}
              hitSlop={{ top: INSET, bottom: INSET }}
              onPress={() => onChange(it.key)}
              style={[styles.segment(segment), on && styles.segmentOn(plain)]}
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

const styles = StyleSheet.create((theme) => ({
  track: (height: number, width: number | undefined) => ({ height, width, borderRadius: height / 2 }),
  plain: { backgroundColor: theme.colors.fill },
  row: { flex: 1, flexDirection: 'row', padding: INSET },
  segment: (size: number) => ({ flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: size / 2 }),
  segmentOn: (plain: boolean) => ({
    backgroundColor: plain ? (theme.mode === 'dark' ? theme.colors.fill2 : theme.colors.bg) : theme.colors.fill,
    boxShadow: cssShadow.segment,
  }),
}))

export default SegmentedControl
