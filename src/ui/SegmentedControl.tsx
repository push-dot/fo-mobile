import { Pressable, View } from 'react-native'
import { radius, useColors } from '../theme'
import { Text } from './Text'

/** 2–3 peer views; 44px pill track in fill, selected segment bg + t1 with a soft lift. */
export function SegmentedControl<K extends string>({
  items,
  value,
  onChange,
}: {
  items: { key: K; label: string }[]
  /** null = nothing picked yet. */
  value: K | null
  onChange: (k: K) => void
}) {
  const c = useColors()
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', height: 44, padding: 4, borderRadius: radius.pill, backgroundColor: c.fill }}>
      {items.map((it) => {
        const on = it.key === value
        return (
          <Pressable
            key={it.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(it.key)}
            style={[
              { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
              on && { backgroundColor: c.bg, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
            ]}
          >
            <Text v="b2" weight="600" color={on ? 't1' : 't3'} numberOfLines={1}>
              {it.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
