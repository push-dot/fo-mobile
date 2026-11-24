import { View } from 'react-native'
import { Mascot, Text } from '@/shared/components'
import { radius, spacing, useColors } from '../../../../theme'
import type { BotRow } from '../../types'

const WIDTH = 300

const BotHomePreview = ({ row }: { row: BotRow }) => {
  const c = useColors()
  return (
    <View
      style={{
        width: WIDTH,
        padding: spacing[5],
        gap: spacing[4],
        backgroundColor: c.bg,
        borderRadius: radius.xl,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
        <Mascot size={64} state={row.mascot} color={row.color} unread={row.unreadDot} motion={{ mode: 'animate' }} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text v="h3" numberOfLines={2}>
            {row.name}
          </Text>
          {row.time ? (
            <Text v="c1" color="t3">
              {row.time}
            </Text>
          ) : null}
        </View>
      </View>
      <Text v="b2" color={row.line ? 't2' : 't3'} numberOfLines={5}>
        {row.line || '아직 나눈 대화가 없어요'}
      </Text>
    </View>
  )
}

export default BotHomePreview
