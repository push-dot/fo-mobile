import { Pressable, View } from 'react-native'
import { ContextMenu, Mascot, Text, type MenuAction } from '@/shared/components'
import { useColors } from '../../../../theme'
import type { BotRow } from '../../types'
import { heroLabel, type HomeMotion } from '../../utils/home-rows'
import { HERO_NAME } from './copy'
import BotHomePreview from './bot-home-preview'
import type { HomeChrome } from './metrics'

const BotHomeHero = ({
  chrome,
  motion,
  row,
  actions,
  onPress,
}: {
  chrome: HomeChrome
  motion: HomeMotion
  row: BotRow
  actions: MenuAction[]
  onPress: () => void
}) => {
  const c = useColors()
  const wrap = { alignItems: 'center' as const, paddingTop: 2, paddingHorizontal: 32, paddingBottom: 14 }
  const nameRow = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, marginTop: 10 }
  const name = { fontSize: chrome.heroNameSize, lineHeight: chrome.heroNameLine }
  const dot = { width: 8, height: 8, borderRadius: 4, backgroundColor: c.ac }
  const content = (
    <View style={wrap}>
      <Mascot size={chrome.hero} state={row.mascot} color="push" motion={motion} />
      <View style={nameRow}>
        <Text allowFontScaling={chrome.noScale} weight="700" style={name}>
          {HERO_NAME}
        </Text>
        {row.unreadDot ? <View style={dot} /> : null}
      </View>
    </View>
  )
  if (actions.length === 0) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={heroLabel(row.unreadDot)} onPress={onPress}>
        {content}
      </Pressable>
    )
  }
  return (
    <ContextMenu actions={actions} accessibilityLabel={heroLabel(row.unreadDot)} onPress={onPress} preview={<BotHomePreview row={row} />}>
      {content}
    </ContextMenu>
  )
}

export default BotHomeHero
