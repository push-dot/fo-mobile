import { Platform, Pressable, View } from 'react-native'
import { Text } from '@/shared/components'
import { radius, spacing, useColors } from '../../../../theme'
import { READ_OFF_ACTIONS } from '../../constants'
import type { ChatItem } from '../../types'
import { Appear } from '../motion'

export type ReadOffAction = keyof typeof READ_OFF_ACTIONS

/** ChatBotReadOff: the bot bubble that says 내 자료 읽기 is off, with the two ways out (bold bare labels on iOS, white chips on Android). */
const ReadOff = ({ item, onAction }: { item: Extract<ChatItem, { type: 'readOff' }>; onAction?: (action: ReadOffAction) => void }) => {
  const c = useColors()
  return (
    <Appear kind="bubble" style={{ alignSelf: 'flex-start', maxWidth: '88%' }}>
      <View style={{ paddingVertical: 11, paddingHorizontal: 15, borderRadius: radius.lg, borderBottomLeftRadius: radius.xs, backgroundColor: c.fill }}>
        <Text v="b1">{item.text}</Text>
        <View style={{ flexDirection: 'row', gap: spacing[2], marginTop: spacing[3] }}>
          {(Object.keys(READ_OFF_ACTIONS) as ReadOffAction[]).map((action) => (
            <Pressable
              key={action}
              accessibilityRole="button"
              onPress={() => onAction?.(action)}
              style={{ height: 40, paddingHorizontal: 14, borderRadius: Platform.OS === 'ios' ? radius.buttonSmIos : radius.buttonSmAndroid, alignItems: 'center', justifyContent: 'center', backgroundColor: Platform.OS === 'ios' ? 'transparent' : c.bg }}
            >
              <Text v="c1" weight="700" style={{ fontSize: 14 }}>
                {READ_OFF_ACTIONS[action]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Appear>
  )
}

export default ReadOff
