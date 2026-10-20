import type { ReactNode } from 'react'
import { Pressable, Switch as RNSwitch, View } from 'react-native'
import { radius, useColors } from '../theme'
import { Icon } from './Icon'
import { Text } from './Text'

/** 51×31 switch: ac on, fill2 off, white knob. Applies immediately. */
export function Switch({ value, onValueChange, label }: { value: boolean; onValueChange: (v: boolean) => void; label: string }) {
  const c = useColors()
  return (
    <RNSwitch
      accessibilityLabel={label}
      value={value}
      onValueChange={onValueChange}
      trackColor={{ true: c.ac, false: c.fill2 }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={c.fill2}
    />
  )
}

/** iOS-style grouped list: 13px bold t3 title, bg2 group (radius-lg), optional 12px t3 note. */
export function SettingsGroup({ title, note, children }: { title?: string; note?: string; children: ReactNode }) {
  const c = useColors()
  const rows = Array.isArray(children) ? children.filter(Boolean) : [children]
  return (
    <View>
      {title ? (
        <Text v="c1" weight="700" color="t3" style={{ paddingHorizontal: 8, paddingBottom: 8 }}>
          {title}
        </Text>
      ) : null}
      <View style={{ borderRadius: radius.lg, backgroundColor: c.bg2, paddingHorizontal: 16 }}>
        {rows.map((row, i) => (
          <View key={i} style={i > 0 ? { borderTopWidth: 1, borderTopColor: c.line } : undefined}>
            {row}
          </View>
        ))}
      </View>
      {note ? (
        <Text v="c2" color="t3" style={{ paddingHorizontal: 8, paddingTop: 8, lineHeight: 17 }}>
          {note}
        </Text>
      ) : null}
    </View>
  )
}

type RowProps = {
  label: string
  sub?: string
  value?: string
  onPress?: () => void
  right?: ReactNode
  danger?: boolean
}

/** 56px row ending in value + chevron (navigates), a switch, or a select pill via `right`. */
export function SettingsRow({ label, sub, value, onPress, right, danger }: RowProps) {
  const body = (
    <View style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
      <View style={{ flex: 1 }}>
        <Text v="b1" color={danger ? 'red' : 't1'}>
          {label}
        </Text>
        {sub ? (
          <Text v="c1" color="t3">
            {sub}
          </Text>
        ) : null}
      </View>
      {right ??
        (onPress ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            {value ? (
              <Text v="b1" color="t3">
                {value}
              </Text>
            ) : null}
            <Icon name="chev" size={18} color="t4" />
          </View>
        ) : value ? (
          <Text v="b1" color="t3">
            {value}
          </Text>
        ) : null)}
    </View>
  )
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {body}
    </Pressable>
  ) : (
    body
  )
}
