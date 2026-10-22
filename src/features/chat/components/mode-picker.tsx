import type { AccessMode } from '@push/api-client'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { BottomSheet, Icon, Text } from '@/shared/components'
import { useColors } from '../../../theme'
import { ACCESS_MODE_TITLE, ACCESS_MODES } from '../constants'
import Pick from './pick'

const ModePicker = ({ value, onChange }: { value: AccessMode; onChange: (mode: AccessMode) => void }) => {
  const c = useColors()
  const [open, setOpen] = useState(false)
  const current = ACCESS_MODES.find((m) => m.key === value) ?? ACCESS_MODES[1]!
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`실행 방식, ${current.label}`}
        onPress={() => setOpen(true)}
        style={{ height: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: c.fill, flexDirection: 'row', alignItems: 'center', gap: 4 }}
      >
        <Text v="c1" weight="600" style={{ fontSize: 14 }}>
          {current.label}
        </Text>
        <Icon name="down" size={14} color="t3" />
      </Pressable>
      <BottomSheet visible={open} onClose={() => setOpen(false)} title={ACCESS_MODE_TITLE}>
        {ACCESS_MODES.map((m) => (
          <Pressable
            key={m.key}
            accessibilityRole="radio"
            accessibilityState={{ selected: m.key === value }}
            onPress={() => (onChange(m.key), setOpen(false))}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 8 }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text v="b1" weight="600">
                {m.label}
              </Text>
              <Text v="c1" color="t3">
                {m.desc}
              </Text>
            </View>
            <Pick on={m.key === value} />
          </Pressable>
        ))}
      </BottomSheet>
    </>
  )
}

export default ModePicker
