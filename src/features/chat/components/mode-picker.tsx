import type { AccessMode } from '@push/api-client'
import { router } from 'expo-router'
import { Pressable } from 'react-native'
import { Icon, Text, hitSlopTo } from '@/shared/components'
import { useColors } from '../../../theme'
import { ACCESS_MODES } from '../constants'

const ModePicker = ({ value }: { value: AccessMode }) => {
  const c = useColors()
  const current = ACCESS_MODES.find((m) => m.key === value) ?? ACCESS_MODES[1]!
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`실행 방식, ${current.label}`}
      onPress={() => router.push('/access-mode')}
      hitSlop={hitSlopTo(40)}
      style={{ height: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: c.fill, flexDirection: 'row', alignItems: 'center', gap: 4 }}
    >
      <Text v="c1" weight="600" style={{ fontSize: 14 }}>
        {current.label}
      </Text>
      <Icon name="down" size={14} color="t3" />
    </Pressable>
  )
}

export default ModePicker
