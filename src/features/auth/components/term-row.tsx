import { Pressable, View } from 'react-native'
import { Icon, Text } from '../../../shared/components'
import { useColors } from '../../../theme'

const TermRow = ({
  label,
  badge,
  checked,
  onPress,
}: {
  label: string
  badge?: string
  checked: boolean
  onPress: () => void
}) => {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onPress}
      style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12 }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: checked ? c.ac : c.fill,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked ? <Icon name="check" size={14} color="#FFFFFF" /> : null}
      </View>
      {badge ? (
        <Text v="c1" weight="700" color={badge === '필수' ? 'acText' : 't3'} style={{ width: 32 }}>
          {badge}
        </Text>
      ) : null}
      <Text v="b1" style={{ flex: 1 }}>
        {label}
      </Text>
    </Pressable>
  )
}

export default TermRow
