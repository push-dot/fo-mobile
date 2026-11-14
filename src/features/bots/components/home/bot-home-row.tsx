import { Pressable, View } from 'react-native'
import { Highlight, Mascot, Text, type MenuAction } from '@/shared/components'
import type { BotRow } from '../../types'
import { rowMotion } from '../../utils/home-rows'
import BotRowMenu from './bot-row-menu'
import type { HomeChrome } from './metrics'

const BotHomeRow = ({
  row,
  chrome,
  index,
  held,
  query,
  actions,
  onPress,
}: {
  row: BotRow
  chrome: HomeChrome
  index: number
  held: boolean
  query?: string
  actions: MenuAction[]
  onPress: () => void
}) => {
  const box = {
    flexDirection: 'row' as const,
    alignItems: chrome.rowAlign,
    gap: chrome.rowGap,
    paddingVertical: chrome.rowPadV,
    paddingHorizontal: chrome.rowPadH,
    minHeight: 76,
  }
  const mascot = { marginTop: chrome.mascotTop }
  const body = { flex: 1, minWidth: 0, gap: 3 }
  const top = { flexDirection: 'row' as const, alignItems: chrome.rowAlign, gap: chrome.nameGap }
  const name = { flex: 1, fontSize: chrome.nameSize, lineHeight: chrome.nameLine }
  const time = { fontSize: chrome.timeSize, lineHeight: chrome.timeLine }
  const line = { fontSize: chrome.msgSize, lineHeight: chrome.msgLine }
  const q = query ?? ''
  const content = (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={box}>
      <View style={mascot}>
        <Mascot size={chrome.rowMascot} state={row.mascot} color={row.color} unread={row.unreadDot} motion={rowMotion(row.mascot, index, held)} />
      </View>
      <View style={body}>
        <View style={top}>
          <Text weight="700" numberOfLines={chrome.nameLines} style={name}>
            <Highlight text={row.name} q={q} />
          </Text>
          <Text color="t3" style={time}>
            {row.time}
          </Text>
        </View>
        {row.line ? (
          <Text color="t3" numberOfLines={chrome.msgLines} style={line}>
            <Highlight text={row.line} q={q} />
          </Text>
        ) : null}
      </View>
    </View>
  )
  if (actions.length === 0) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={row.accessibilityLabel} onPress={onPress}>
        {content}
      </Pressable>
    )
  }
  return (
    <BotRowMenu actions={actions} accessibilityLabel={row.accessibilityLabel} onPress={onPress}>
      {content}
    </BotRowMenu>
  )
}

export default BotHomeRow
