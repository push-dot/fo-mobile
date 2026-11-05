import { Pressable, View } from 'react-native'
import { Icon, Text, type IconName } from '@/shared/components'
import { radius, spacing, useColors } from '../../../theme'

const TILE = 44

const PickRow = ({
  icon,
  title,
  sub,
  tone,
  onPress,
}: {
  icon: IconName
  title: string
  sub: string
  tone: 'ac' | 'green'
  onPress: () => void
}) => {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3] }}
    >
      <View
        style={{
          width: TILE,
          height: TILE,
          borderRadius: radius.sm,
          backgroundColor: tone === 'ac' ? c.acSoft : c.greenSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={22} color={tone === 'ac' ? c.acText : c.green} />
      </View>
      <View style={{ flex: 1 }}>
        <Text v="b1" weight="700">
          {title}
        </Text>
        <Text v="c1" color="t3">
          {sub}
        </Text>
      </View>
      <Icon name="chev" size={18} color="t4" />
    </Pressable>
  )
}

export default PickRow
