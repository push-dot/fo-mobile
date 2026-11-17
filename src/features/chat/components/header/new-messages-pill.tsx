import { View } from 'react-native'
import { GlassPressable, Icon, Text } from '@/shared/components'
import { radius, spacing, useColors } from '../../../../theme'

/** Bot lines landed below the fold. Floats at the bottom of the thread as interactive glass (ChatBotHeaderNew). */
export const NewMessagesPill = ({ count, onPress }: { count: number; onPress: () => void }) => {
  const c = useColors()
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: spacing[3], alignItems: 'center', zIndex: 4 }}>
      <GlassPressable
        accessibilityRole="button"
        onPress={onPress}
        fill="glass"
        style={{ height: 40, paddingHorizontal: spacing[4], borderRadius: radius.pill, borderWidth: 1, borderColor: c.line }}
        contentStyle={{ gap: 6 }}
      >
        <Icon name="down" size={18} color={c.t1} />
        <Text v="c1" weight="600" color="t1" style={{ fontSize: 14 }}>
          {`새 메시지 ${count}개`}
        </Text>
      </GlassPressable>
    </View>
  )
}
