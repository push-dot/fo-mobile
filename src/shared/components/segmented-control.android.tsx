import { Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { cssShadow, spacing } from '../../theme'
import { COMPACT_HEIGHT, COMPACT_WIDTH } from './segmented-control.compact'
import Text from './text'

export type SegmentedControlProps<K extends string> = {
  items: { key: K; label: string }[]
  value: K | null
  onChange: (k: K) => void
  compact?: boolean
  slim?: boolean
}

const INSET = spacing[1]

const VARIANT = {
  regular: { height: 44, width: undefined, group: 'tablist', item: 'tab', state: (on: boolean) => ({ selected: on }) },
  compact: { height: COMPACT_HEIGHT, width: COMPACT_WIDTH, group: 'radiogroup', item: 'radio', state: (on: boolean) => ({ checked: on }) },
} as const

const SegmentedControl = <K extends string,>({ items, value, onChange, compact }: SegmentedControlProps<K>) => {
  const variant = VARIANT[compact ? 'compact' : 'regular']
  const segment = variant.height - 2 * INSET
  return (
    <View
      accessibilityRole={variant.group}
      style={styles.track(variant.height, variant.width)}
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
            style={[styles.segment(segment), on && styles.segmentOn]}
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

const styles = StyleSheet.create((theme) => ({
  track: (height: number, width: number | undefined) => ({ height, width, borderRadius: height / 2, backgroundColor: theme.colors.fill, flexDirection: 'row', padding: INSET }),
  segment: (size: number) => ({ flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: size / 2 }),
  segmentOn: { backgroundColor: theme.mode === 'dark' ? theme.colors.fill2 : theme.colors.bg, boxShadow: cssShadow.segment },
}))

export default SegmentedControl
