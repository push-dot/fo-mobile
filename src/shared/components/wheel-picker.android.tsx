import { useEffect, useRef, type ComponentRef } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { spacing, type, useColors } from '../../theme'
import Text from './text'

export type WheelPickerProps = {
  items: readonly { key: string; label: string }[]
  value: string
  onChange: (key: string) => void
  accessibilityLabel: string
  columns?: boolean
  short?: boolean
}

export const WHEEL_HEIGHT = { full: 180, columns: 150, short: 120 } as const

const ROW = 38
const PAD = (WHEEL_HEIGHT.columns - ROW) / 2

const RadioList = ({ items, value, onChange, accessibilityLabel }: WheelPickerProps) => {
  const c = useColors()
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {items.map((it, i) => {
        const on = it.key === value
        return (
          <Pressable
            key={it.key}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onChange(it.key)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing[3],
              minHeight: 50,
              borderBottomWidth: i < items.length - 1 ? 1 : 0,
              borderBottomColor: c.line,
            }}
          >
            <Text v="h3" weight="400" style={{ flex: 1, lineHeight: type.b2.lineHeight }}>
              {it.label}
            </Text>
            {on ? (
              <Text v="h3" weight="700" color="ac" style={{ lineHeight: type.b2.lineHeight }}>
                ✓
              </Text>
            ) : null}
          </Pressable>
        )
      })}
    </View>
  )
}

const SnapWheel = ({ items, value, onChange, accessibilityLabel }: WheelPickerProps) => {
  const c = useColors()
  const ref = useRef<ComponentRef<typeof ScrollView>>(null)
  const index = Math.max(0, items.findIndex((it) => it.key === value))
  useEffect(() => ref.current?.scrollTo({ y: index * ROW, animated: false }), [index, items])
  return (
    <View accessibilityLabel={accessibilityLabel} style={{ flex: 1, height: WHEEL_HEIGHT.columns }}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW}
        decelerationRate="fast"
        nestedScrollEnabled
        contentContainerStyle={{ paddingVertical: PAD }}
        onMomentumScrollEnd={(e) => {
          const next = items[Math.min(items.length - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.y / ROW)))]
          if (next && next.key !== value) onChange(next.key)
        }}
      >
        {items.map((it) => (
          <View key={it.key} style={{ height: ROW, justifyContent: 'center', alignItems: 'center' }}>
            <Text v="b1" weight={it.key === value ? '600' : '400'} color={it.key === value ? 't1' : 't3'}>
              {it.label}
            </Text>
          </View>
        ))}
      </ScrollView>
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: PAD, height: ROW, borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.ac }} />
    </View>
  )
}

const WheelPicker = (props: WheelPickerProps) => (props.columns ? <SnapWheel {...props} /> : <RadioList {...props} />)

export default WheelPicker
