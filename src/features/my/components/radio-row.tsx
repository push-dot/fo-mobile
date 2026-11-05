import { Pressable, View } from 'react-native'
import { Text } from '@/shared/components'
import { spacing, useColors } from '../../../theme'

const RADIO = 22

const RadioRow = ({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) => {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4], paddingVertical: spacing[4], paddingHorizontal: spacing[1] }}
    >
      <Text v="b1" weight={on ? '700' : '600'} style={{ flex: 1 }}>
        {label}
      </Text>
      <View
        style={{
          width: RADIO,
          height: RADIO,
          borderRadius: RADIO / 2,
          borderWidth: on ? 7 : 2,
          borderColor: on ? c.ac : c.t4,
        }}
      />
    </Pressable>
  )
}

export default RadioRow
