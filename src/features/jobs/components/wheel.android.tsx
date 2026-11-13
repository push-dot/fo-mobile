import { useEffect, useRef, type ComponentRef } from 'react'
import { ScrollView, View } from 'react-native'
import { Text } from '../../../shared/components'
import { useColors } from '../../../theme'
import { WHEEL_HEIGHT, type WheelProps } from './wheel-types'

const ROW = 38
const PAD = (WHEEL_HEIGHT - ROW) / 2

// shortcut: Android has no wheel in the Compose set @expo/ui ships, so this is a snapping list with a selection band.
const Wheel = ({ options, value, onChange, label }: WheelProps) => {
  const c = useColors()
  const ref = useRef<ComponentRef<typeof ScrollView>>(null)
  const index = Math.max(0, options.findIndex((o) => o.value === value))
  useEffect(() => ref.current?.scrollTo({ y: index * ROW, animated: false }), [index, options])
  return (
    <View accessibilityLabel={label} style={{ flex: 1, height: WHEEL_HEIGHT }}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW}
        decelerationRate="fast"
        nestedScrollEnabled
        contentContainerStyle={{ paddingVertical: PAD }}
        onMomentumScrollEnd={(e) => {
          const next = options[Math.min(options.length - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.y / ROW)))]
          if (next && next.value !== value) onChange(next.value)
        }}
      >
        {options.map((o) => (
          <View key={o.value} style={{ height: ROW, justifyContent: 'center', alignItems: 'center' }}>
            <Text v="b1" weight={o.value === value ? '600' : '400'} color={o.value === value ? 't1' : 't3'}>
              {o.label}
            </Text>
          </View>
        ))}
      </ScrollView>
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: PAD, height: ROW, borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.ac }} />
    </View>
  )
}

export default Wheel
