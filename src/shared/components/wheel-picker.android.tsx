import { useEffect, useRef, type ComponentRef } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { spacing, useColors } from '../../theme'
import Text from './text'

export type WheelPickerProps = {
  items: readonly { key: string; label: string }[]
  value: string
  onChange: (key: string) => void
  accessibilityLabel: string
  /** One of two wheels side by side (시·도 and 구 in the job filter) instead of a full-width picker. */
  columns?: boolean
  /** iOS: a 120pt wheel for a list of three or fewer (SettingsLanguage), so the modal is as high as its content. */
  short?: boolean
}

export const WHEEL_HEIGHT = { full: 180, columns: 150, short: 120 } as const

const RADIO = 20
const ROW = 38
const PAD = (WHEEL_HEIGHT.columns - ROW) / 2

/** Android's single-choice list (radio rows), as the settings board draws it. */
const RadioList = ({ items, value, onChange, accessibilityLabel }: WheelPickerProps) => {
  const c = useColors()
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {items.map((it) => {
        const on = it.key === value
        return (
          <Pressable
            key={it.key}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onChange(it.key)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4], minHeight: 52, paddingHorizontal: spacing[1] }}
          >
            <View style={{ width: RADIO, height: RADIO, borderRadius: RADIO / 2, borderWidth: on ? 6 : 2, borderColor: on ? c.ac : c.t3 }} />
            <Text v="b1" style={{ flex: 1 }}>
              {it.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

// shortcut: Android has no wheel in the Compose set @expo/ui ships, so side-by-side wheels are a snapping list with a selection band.
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
