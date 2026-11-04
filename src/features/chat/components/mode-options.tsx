import type { AccessMode } from '@push/api-client'
import { Pressable, View } from 'react-native'
import { Text } from '@/shared/components'
import { ACCESS_MODES } from '../constants'
import Pick from './pick'

const ModeOptions = ({ value, onChange }: { value: AccessMode; onChange: (mode: AccessMode) => void }) => (
  <View accessibilityRole="radiogroup">
    {ACCESS_MODES.map((m) => (
      <Pressable
        key={m.key}
        accessibilityRole="radio"
        accessibilityState={{ selected: m.key === value }}
        onPress={() => onChange(m.key)}
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
  </View>
)

export default ModeOptions
