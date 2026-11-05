import type { AccessMode } from '@push/api-client'
import { router } from 'expo-router'
import { Pressable, type StyleProp, type ViewStyle } from 'react-native'
import { Icon, Text, hitSlopTo } from '@/shared/components'
import { ACCESS_MODES } from '../constants'

const ModePicker = ({ value, style }: { value: AccessMode; style: StyleProp<ViewStyle> }) => {
  const current = ACCESS_MODES.find((m) => m.key === value) ?? ACCESS_MODES[1]!
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`실행 방식, ${current.label}`} onPress={() => router.push('/access-mode')} hitSlop={hitSlopTo(40)} style={style}>
      <Icon name="auto" size={16} />
      <Text v="c1" weight="600" style={{ fontSize: 14 }}>
        {current.label}
      </Text>
    </Pressable>
  )
}

export default ModePicker
