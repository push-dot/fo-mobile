import { Pressable, View } from 'react-native'
import { ContextMenu, Mascot, Text, type MenuAction } from '@/shared/components'
import { spacing } from '../../../../theme'
import type { BotRow } from '../../types'
import { homeRowLabel, rowMotion } from '../../utils/home-rows'
import Highlight from './highlight'
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
    alignItems: chrome.nameLines > 1 ? ('flex-start' as const) : ('center' as const),
    gap: chrome.rowGap,
    paddingVertical: chrome.rowPadV,
    paddingHorizontal: chrome.rowPadH,
    minHeight: 76,
  }
  const body = { flex: 1, minWidth: 0, gap: 2 }
  const top = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing[2] }
  const name = { flex: 1, fontSize: chrome.nameSize, lineHeight: chrome.nameLine }
  const time = { fontSize: chrome.timeSize, lineHeight: chrome.timeLine }
  const line = { fontSize: chrome.msgSize, lineHeight: chrome.msgLine }
  const q = query ?? ''
  const content = (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={box}>
      <Mascot size={chrome.rowMascot} state={row.mascot} color={row.color} unread={row.unreadDot} motion={rowMotion(row.mascot, index, held)} />
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
      <Pressable accessibilityRole="button" accessibilityLabel={homeRowLabel(row)} onPress={onPress}>
        {content}
      </Pressable>
    )
  }
  return (
    <ContextMenu actions={actions} accessibilityLabel={homeRowLabel(row)} onPress={onPress}>
      {content}
    </ContextMenu>
  )
}

export default BotHomeRow
