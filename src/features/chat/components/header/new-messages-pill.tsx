import { Platform, Pressable, View } from 'react-native'
import { Glass, Icon, Text } from '@/shared/components'
import { radius, spacing, useColors } from '../../../../theme'

const ios = Platform.OS === 'ios'

/** Bot lines landed below the fold. Floats at the bottom of the thread. */
export const NewMessagesPill = ({ count, onPress }: { count: number; onPress: () => void }) => {
  const c = useColors()
  const ink = ios ? 't1' : 'bg'
  const button = (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{ height: 40, paddingHorizontal: spacing[4], borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: ios ? 'transparent' : c.t1 }}
    >
      <Icon name="down" size={18} color={ink} />
      <Text v="c1" weight="700" color={ink} style={{ fontSize: 14 }}>
        {`새 메시지 ${count}개`}
      </Text>
    </Pressable>
  )
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: spacing[3], alignItems: 'center', zIndex: 4 }}>
      {ios ? <Glass style={{ height: 40, borderRadius: radius.pill }}>{button}</Glass> : button}
    </View>
  )
}
